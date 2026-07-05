import { AdapterResponse } from "../validation/envelope";
export declare class BookStackAdapter {
    private options?;
    constructor(options?: {
        mock?: boolean;
        baseUrl?: string;
        tokenUrl?: string;
    });
    upsertShelf(shelf_id: string, name: string, description?: string): Promise<any>;
    upsertBook(shelf_id: string, book_id: string, name: string, description?: string): Promise<any>;
    upsertChapter(book_id: string, chapter_id: string, name: string, description?: string): Promise<any>;
    upsertPage(chapter_id: string, page_id: string, title: string, content: string, metadata?: any): Promise<any>;
    getPage(page_id: string): Promise<any>;
    search(q: string): Promise<any>;
    health(): Promise<any>;
    run(action: string, payload: any): Promise<AdapterResponse<any>>;
    _call(operation: string, payload: any): Promise<any>;
    private validateResponse;
}
//# sourceMappingURL=BookStackAdapter.d.ts.map