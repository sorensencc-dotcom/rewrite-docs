// src/adapters/index.ts
import { BookStackAdapter } from "./BookStackAdapter.js";
import { BrowserNavigateAdapter } from "./BrowserNavigateAdapter.js";
import { BrowserScreenshotAdapter } from "./BrowserScreenshotAdapter.js";
import { ModelGenerateAdapter } from "./ModelGenerateAdapter.js";
import { PuppeteerEngine } from "./PuppeteerEngine.js";
import { RLVaultAdapter } from "./RLVaultAdapter.js";
export const adapterRegistry = {
    bookstack: () => new BookStackAdapter(),
    BrowserNavigate: () => new BrowserNavigateAdapter(),
    BrowserScreenshot: () => new BrowserScreenshotAdapter(),
    ModelGenerate: () => new ModelGenerateAdapter(),
    PuppeteerEngine: () => new PuppeteerEngine(),
    "rl-vault": () => new RLVaultAdapter(),
};
//# sourceMappingURL=index.js.map