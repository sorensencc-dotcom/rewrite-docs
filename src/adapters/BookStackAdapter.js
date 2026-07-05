// src/adapters/BookStackAdapter.ts
import { validatePageContent } from "../validation/guards";
import { BookStackUpsertResponseSchema, BookStackPageSchema, BookStackSearchResultsSchema, BookStackHealthStatusSchema, } from "../validation/schemas";
import { metricsExporter } from "../metrics/MetricsExporter";
import { adapterLogger } from "../logging/adapterLogger";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { config } from "../config";
import { makeSuccess, makeError } from "../validation/envelope";
export class BookStackAdapter {
    options;
    constructor(options) {
        this.options = options;
    }
    async upsertShelf(shelf_id, name, description) {
        return this._call("shelf.upsert", { shelf_id, name, description });
    }
    async upsertBook(shelf_id, book_id, name, description) {
        return this._call("book.upsert", { shelf_id, book_id, name, description });
    }
    async upsertChapter(book_id, chapter_id, name, description) {
        return this._call("chapter.upsert", { book_id, chapter_id, name, description });
    }
    async upsertPage(chapter_id, page_id, title, content, metadata) {
        validatePageContent(content);
        return this._call("page.upsert", {
            chapter_id,
            page_id,
            title,
            content,
            metadata,
        });
    }
    async getPage(page_id) {
        return this._call("page.get", { page_id });
    }
    async search(q) {
        return this._call("search", { q });
    }
    async health() {
        return this._call("health", {});
    }
    async run(action, payload) {
        const startTime = Date.now();
        try {
            let data;
            switch (action) {
                case "upsertShelf":
                    data = await this.upsertShelf(payload.shelf_id, payload.name, payload.description);
                    break;
                case "upsertBook":
                    data = await this.upsertBook(payload.shelf_id, payload.book_id, payload.name, payload.description);
                    break;
                case "upsertChapter":
                    data = await this.upsertChapter(payload.book_id, payload.chapter_id, payload.name, payload.description);
                    break;
                case "upsertPage":
                    data = await this.upsertPage(payload.chapter_id, payload.page_id, payload.title, payload.content, payload.metadata);
                    break;
                case "getPage":
                    data = await this.getPage(payload.page_id);
                    break;
                case "search":
                    data = await this.search(payload.q);
                    break;
                case "health":
                    data = await this.health();
                    break;
                default:
                    throw new Error(`Unknown BookStackAdapter action: ${action}`);
            }
            return makeSuccess(data, "BookStackAdapter", startTime);
        }
        catch (err) {
            let code = 'EXECUTION_FAILED';
            if (err.message?.includes('Page content')) {
                code = 'GUARD_VIOLATION';
            }
            else if (err.message?.includes('validation')) {
                code = 'INVALID_RESPONSE';
            }
            return makeError(code, { reason: err.message || 'Unknown error' }, "BookStackAdapter", startTime);
        }
    }
    async _call(operation, payload) {
        const start = performance.now();
        metricsExporter.increment("cic_adapter_calls_total", { adapter: "bookstack", operation });
        try {
            const response = await fetchWithAuth(`/bookstack/${operation}`, payload, {
                mock: this.options?.mock !== undefined ? this.options.mock : config.bookstack.mock,
                baseUrl: this.options?.baseUrl || config.bookstack.baseUrl,
                tokenUrl: this.options?.tokenUrl || config.bookstack.oidc.tokenUrl,
            });
            // Validate response against the appropriate schema
            this.validateResponse(operation, response);
            adapterLogger.info({ adapter: "bookstack", operation, payload });
            return response;
        }
        catch (err) {
            metricsExporter.increment("cic_adapter_errors_total", { adapter: "bookstack", operation });
            adapterLogger.error({ adapter: "bookstack", operation, error: err });
            throw err;
        }
        finally {
            const duration = performance.now() - start;
            metricsExporter.observe("cic_adapter_duration_ms", duration, { adapter: "bookstack", operation });
        }
    }
    validateResponse(operation, response) {
        let schema;
        if (operation.endsWith('.upsert') || operation.includes('upsert')) {
            schema = BookStackUpsertResponseSchema;
        }
        else if (operation.includes('page.get')) {
            schema = BookStackPageSchema;
        }
        else if (operation.includes('search')) {
            schema = BookStackSearchResultsSchema;
        }
        else if (operation.includes('health')) {
            schema = BookStackHealthStatusSchema;
        }
        if (schema) {
            const parsed = schema.safeParse(response);
            if (!parsed.success) {
                throw new Error(`Response validation failed: ${JSON.stringify(parsed.error.errors)}`);
            }
        }
    }
}
//# sourceMappingURL=BookStackAdapter.js.map