import { UnifiedChatRequest, UnifiedChatResponse } from "../types/unifiedChatTypes.js";
import { cloudProviders } from "./cloudProviders.js";
export declare function dispatchToCloud(providerName: string, req: UnifiedChatRequest): Promise<UnifiedChatResponse>;
export declare function handleCloudDispatch(req: UnifiedChatRequest): string | null;
export declare function handleChat(req: UnifiedChatRequest): Promise<UnifiedChatResponse>;
export declare function handleGetModels(allowCloud?: boolean): string[];
export declare function handleHealth(allowCloud?: boolean): Promise<{
    status: string;
    providers: Record<string, boolean>;
}>;
export { cloudProviders };
//# sourceMappingURL=adapterGatewayAPI-cloud-additions.d.ts.map