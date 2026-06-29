// src/adapters/index.ts
import { BookStackAdapter } from "./BookStackAdapter.js";
import { BrowserNavigateAdapter } from "./BrowserNavigateAdapter.js";
import { BrowserScreenshotAdapter } from "./BrowserScreenshotAdapter.js";
import { ModelGenerateAdapter } from "./ModelGenerateAdapter.js";
import { PuppeteerEngine } from "./PuppeteerEngine.js";

export const adapterRegistry: Record<string, () => any> = {
  bookstack: () => new BookStackAdapter(),
  BrowserNavigate: () => new BrowserNavigateAdapter(),
  BrowserScreenshot: () => new BrowserScreenshotAdapter(),
  ModelGenerate: () => new ModelGenerateAdapter(),
  PuppeteerEngine: () => new PuppeteerEngine()
};
