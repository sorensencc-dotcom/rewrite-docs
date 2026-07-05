import fs from "fs/promises";
import path from "path";
import { CacheLockManager } from "./cache-locks";
export class L2DiskCache {
    dir;
    lockManager = new CacheLockManager();
    constructor(dir) {
        this.dir = dir;
    }
    async init() {
        try {
            await fs.mkdir(this.dir, { recursive: true });
        }
        catch (error) {
            throw new Error(`Failed to initialize disk cache directory: ${error}`);
        }
    }
    async get(key) {
        return this.lockManager.withLock(key, async () => {
            try {
                const file = path.join(this.dir, `${key}.json`);
                const data = await fs.readFile(file, "utf8");
                const entry = JSON.parse(data);
                if (entry.ttlMs && Date.now() - entry.timestamp > entry.ttlMs) {
                    await fs.unlink(file).catch(() => { });
                    return null;
                }
                return entry.value;
            }
            catch {
                return null;
            }
        });
    }
    async set(key, value, ttlMs) {
        return this.lockManager.withLock(key, async () => {
            try {
                const file = path.join(this.dir, `${key}.json`);
                const entry = {
                    key,
                    value,
                    timestamp: Date.now(),
                    ttlMs,
                };
                await fs.writeFile(file, JSON.stringify(entry), "utf8");
            }
            catch (error) {
                throw new Error(`Failed to write cache entry: ${error}`);
            }
        });
    }
    async has(key) {
        return this.lockManager.withLock(key, async () => {
            try {
                const file = path.join(this.dir, `${key}.json`);
                await fs.access(file);
                return true;
            }
            catch {
                return false;
            }
        });
    }
    async delete(key) {
        return this.lockManager.withLock(key, async () => {
            try {
                const file = path.join(this.dir, `${key}.json`);
                await fs.unlink(file);
                return true;
            }
            catch {
                return false;
            }
        });
    }
    async clear() {
        try {
            const files = await fs.readdir(this.dir);
            await Promise.all(files
                .filter((f) => f.endsWith(".json"))
                .map((f) => fs.unlink(path.join(this.dir, f))));
        }
        catch (error) {
            throw new Error(`Failed to clear disk cache: ${error}`);
        }
    }
    async list() {
        try {
            const files = await fs.readdir(this.dir);
            return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));
        }
        catch {
            return [];
        }
    }
}
//# sourceMappingURL=l2-disk-cache.js.map