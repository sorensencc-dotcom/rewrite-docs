import { v4 as uuid } from "uuid";
import { logger } from "../../lib/logger";
import { CloakBrowser } from "./CloakBrowser";
export class WarmPoolManager {
    pool = [];
    waitingList = [];
    targetSize;
    maxSessionAgeMs = 5 * 60 * 1000; // 5 minutes
    maxNavigationsPerSession = 50;
    healthCheckIntervalMs = 30 * 1000; // 30 seconds
    initializing = false;
    initialized = false;
    healthCheckInterval = null;
    // Metrics
    checkoutCount = 0;
    checkinCount = 0;
    spawnCount = 0;
    recycleCount = 0;
    totalNavigations = 0;
    constructor(targetSize = 3) {
        this.targetSize = targetSize;
    }
    async init() {
        if (this.initialized)
            return;
        if (this.initializing) {
            await new Promise((r) => setTimeout(r, 100));
            return this.init();
        }
        this.initializing = true;
        logger.info("warm_pool.init", { targetSize: this.targetSize });
        try {
            // Spawn initial pool
            const spawnPromises = [];
            for (let i = 0; i < this.targetSize; i++) {
                spawnPromises.push(this.spawnSession());
            }
            await Promise.all(spawnPromises);
            // Start health checks
            this.startHealthCheck();
            this.initialized = true;
            logger.info("warm_pool.initialized", { poolSize: this.pool.length });
        }
        catch (err) {
            logger.error("warm_pool.init_error", { error: String(err) });
            throw err;
        }
        finally {
            this.initializing = false;
        }
    }
    async spawnSession() {
        try {
            const browser = await CloakBrowser.launch();
            const session = {
                id: uuid(),
                browser,
                createdAt: Date.now(),
                lastUsedAt: 0,
                healthy: true,
                navigationCount: 0,
                errorCount: 0,
                latencyMs: []
            };
            this.pool.push(session);
            this.spawnCount++;
            logger.info("warm_pool.spawn", {
                sessionId: session.id,
                poolSize: this.pool.length,
                totalSpawned: this.spawnCount
            });
        }
        catch (err) {
            logger.error("warm_pool.spawn_error", { error: String(err) });
            throw err;
        }
    }
    async checkout(timeoutMs = 5000) {
        if (!this.initialized) {
            await this.init();
        }
        const startTime = Date.now();
        while (Date.now() - startTime < timeoutMs) {
            // Try to get healthy session
            const session = this.pool.find((s) => s.healthy && this.isSessionValid(s));
            if (session) {
                // Remove from pool
                const index = this.pool.indexOf(session);
                this.pool.splice(index, 1);
                session.lastUsedAt = Date.now();
                this.checkoutCount++;
                logger.info("warm_pool.checkout", {
                    sessionId: session.id,
                    poolSize: this.pool.length,
                    checkouts: this.checkoutCount
                });
                return session;
            }
            // No healthy session, wait and try again
            await new Promise((r) => {
                this.waitingList.push(r);
                setTimeout(() => {
                    const idx = this.waitingList.indexOf(r);
                    if (idx >= 0)
                        this.waitingList.splice(idx, 1);
                    r(undefined);
                }, 100);
            });
        }
        logger.error("warm_pool.checkout_timeout", {
            poolSize: this.pool.length,
            timeoutMs
        });
        throw new Error("WARM_POOL_EMPTY_TIMEOUT");
    }
    async checkin(session) {
        if (!session.healthy) {
            logger.warn("warm_pool.recycle_unhealthy", {
                sessionId: session.id,
                errorCount: session.errorCount
            });
            try {
                await session.browser.close();
            }
            catch (err) {
                logger.error("warm_pool.browser_close_error", { error: String(err) });
            }
            this.recycleCount++;
            // Spawn replacement
            try {
                await this.spawnSession();
            }
            catch (err) {
                logger.error("warm_pool.replacement_spawn_error", { error: String(err) });
            }
            return;
        }
        // Return healthy session to pool
        this.pool.push(session);
        this.checkinCount++;
        logger.info("warm_pool.checkin", {
            sessionId: session.id,
            poolSize: this.pool.length,
            navigationCount: session.navigationCount,
            checkins: this.checkinCount
        });
        // Wake up waiting process
        if (this.waitingList.length > 0) {
            const waiter = this.waitingList.shift();
            waiter?.();
        }
    }
    async recordNavigation(session, latencyMs, success) {
        session.navigationCount++;
        this.totalNavigations++;
        if (success) {
            session.latencyMs.push(latencyMs);
            // Keep only last 10 latencies
            if (session.latencyMs.length > 10) {
                session.latencyMs.shift();
            }
        }
        else {
            session.errorCount++;
            if (session.errorCount >= 3) {
                session.healthy = false;
                logger.warn("warm_pool.session_unhealthy", {
                    sessionId: session.id,
                    errorCount: session.errorCount
                });
            }
        }
        // Recycle if too many navigations
        if (session.navigationCount >= this.maxNavigationsPerSession) {
            session.healthy = false;
            logger.info("warm_pool.max_navigations_reached", {
                sessionId: session.id,
                navigationCount: session.navigationCount
            });
        }
    }
    async startHealthCheck() {
        if (this.healthCheckInterval)
            return;
        this.healthCheckInterval = setInterval(async () => {
            try {
                await this.performHealthCheck();
            }
            catch (err) {
                logger.error("warm_pool.health_check_error", { error: String(err) });
            }
        }, this.healthCheckIntervalMs);
        logger.info("warm_pool.health_check_started", {
            intervalMs: this.healthCheckIntervalMs
        });
    }
    async performHealthCheck() {
        const now = Date.now();
        const sessionsToRemove = [];
        for (const session of this.pool) {
            // Check session age
            if (now - session.createdAt > this.maxSessionAgeMs) {
                logger.info("warm_pool.session_too_old", {
                    sessionId: session.id,
                    ageMs: now - session.createdAt
                });
                sessionsToRemove.push(session);
                continue;
            }
            // Check if session is responsive
            try {
                const responsive = await this.isSessionResponsive(session);
                if (!responsive) {
                    logger.warn("warm_pool.session_unresponsive", {
                        sessionId: session.id
                    });
                    sessionsToRemove.push(session);
                }
            }
            catch (err) {
                logger.error("warm_pool.responsiveness_check_error", {
                    sessionId: session.id,
                    error: String(err)
                });
                sessionsToRemove.push(session);
            }
        }
        // Remove bad sessions and spawn replacements
        for (const session of sessionsToRemove) {
            const index = this.pool.indexOf(session);
            if (index >= 0) {
                this.pool.splice(index, 1);
            }
            try {
                await session.browser.close();
            }
            catch (err) {
                logger.error("warm_pool.browser_close_error", { error: String(err) });
            }
            this.recycleCount++;
            // Spawn replacement if pool is below target
            if (this.pool.length < this.targetSize) {
                try {
                    await this.spawnSession();
                }
                catch (err) {
                    logger.error("warm_pool.replacement_spawn_error", { error: String(err) });
                }
            }
        }
        if (sessionsToRemove.length > 0) {
            logger.info("warm_pool.health_check_complete", {
                removed: sessionsToRemove.length,
                poolSize: this.pool.length,
                totalRecycled: this.recycleCount
            });
        }
    }
    async isSessionResponsive(session) {
        try {
            const page = await session.browser.newPage();
            await Promise.race([
                page.goto("about:blank", { waitUntil: "domContentLoaded" }),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Navigation timeout")), 5000))
            ]);
            await page.close();
            return true;
        }
        catch (err) {
            logger.error("warm_pool.responsiveness_check_failed", {
                sessionId: session.id,
                error: String(err)
            });
            return false;
        }
    }
    isSessionValid(session) {
        const now = Date.now();
        const age = now - session.createdAt;
        const timeSinceUse = now - session.lastUsedAt;
        // Session too old
        if (age > this.maxSessionAgeMs) {
            return false;
        }
        // Too many navigations
        if (session.navigationCount >= this.maxNavigationsPerSession) {
            return false;
        }
        // Too many errors
        if (session.errorCount >= 3) {
            return false;
        }
        return true;
    }
    async drain() {
        logger.info("warm_pool.draining", { poolSize: this.pool.length });
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        const closingPromises = this.pool.map((session) => session.browser.close().catch((err) => {
            logger.error("warm_pool.close_error", {
                sessionId: session.id,
                error: String(err)
            });
        }));
        await Promise.all(closingPromises);
        this.pool = [];
        this.initialized = false;
        logger.info("warm_pool.drained");
    }
    getMetrics() {
        const healthyCount = this.pool.filter((s) => s.healthy).length;
        const unhealthyCount = this.pool.filter((s) => !s.healthy).length;
        const allLatencies = this.pool.flatMap((s) => s.latencyMs);
        const avgLatencyMs = allLatencies.length > 0
            ? allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length
            : 0;
        return {
            poolSize: this.pool.length,
            targetSize: this.targetSize,
            checkoutCount: this.checkoutCount,
            checkinCount: this.checkinCount,
            spawnCount: this.spawnCount,
            recycleCount: this.recycleCount,
            avgLatencyMs: Math.round(avgLatencyMs),
            healthySessionCount: healthyCount,
            unhealthySessionCount: unhealthyCount,
            totalNavigations: this.totalNavigations
        };
    }
}
//# sourceMappingURL=WarmPoolManager.js.map