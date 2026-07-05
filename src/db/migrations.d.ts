import { Database } from "./index";
export declare class MigrationRunner {
    private db;
    constructor(db: Database);
    runMigrations(migrationsDir: string): Promise<void>;
}
//# sourceMappingURL=migrations.d.ts.map