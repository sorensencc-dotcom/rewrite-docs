export interface ExecuteResult {
    rowCount: number;
    affectedRows: number;
    insertId: number;
}
export interface Database {
    query(sql: string, params?: any[]): Promise<any[]>;
    execute(sql: string, params?: any[]): Promise<ExecuteResult>;
    transaction<T>(fn: (db: Database) => Promise<T>): Promise<T>;
    close(): Promise<void>;
}
export declare class StubDatabase implements Database {
    query(): Promise<any[]>;
    execute(): Promise<ExecuteResult>;
    transaction<T>(fn: (db: Database) => Promise<T>): Promise<T>;
    close(): Promise<void>;
}
export declare const database: Database;
//# sourceMappingURL=index.d.ts.map