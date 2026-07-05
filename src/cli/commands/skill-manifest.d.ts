import { Command } from "commander";
import { ManifestService } from "../../governance/services/manifest-service";
import { Database } from "../../governance/db";
interface ManifestCommandOptions {
    db?: Database;
}
export declare function createManifestCommand(manifestService: ManifestService, options?: ManifestCommandOptions): Command;
export {};
//# sourceMappingURL=skill-manifest.d.ts.map