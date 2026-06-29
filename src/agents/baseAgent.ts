import { callModel, ChatPayload, ModelRouter } from "../core/modelRouter.js";
import { getModelSpec, loadModelRegistry } from "../core/modelRegistry.js";
import { ModelSpec } from "../core/modelSpec.js";
import { AgentRoutingProfile } from "./routingProfile.js";

export abstract class BaseAgent {
  protected abstract routingProfile: AgentRoutingProfile;
  protected agentName: string = this.constructor.name;
  protected router = new ModelRouter(loadModelRegistry());

  protected async llm(
    messages: ChatPayload["messages"],
    opts: Partial<{
      model: string;
      temperature: number;
      maxTokens: number;
      tools?: any[];
      requires?: ChatPayload["requires"];
    }> = {}
  ) {
    const payload: ChatPayload = {
      model: "",
      messages,
      temperature: opts.temperature,
      maxTokens: opts.maxTokens,
      tools: opts.tools,
      requires: opts.requires
    };

    let spec: ModelSpec;
    if (opts.model) {
      spec = getModelSpec(opts.model);
    } else {
      spec = this.router.selectModel(this.routingProfile, payload);
    }

    payload.model = spec.name;
    payload.messages = this.formatMessagesForModel(messages, spec);
    payload.maxTokens = opts.maxTokens ?? spec.maxTokens;

    return callModel(payload, this.agentName);
  }

  protected formatMessagesForModel(messages: ChatPayload["messages"], spec: ModelSpec): ChatPayload["messages"] {
    let result = [...messages];

    if (!spec.supports.toolCalls) {
      result = this.stripToolCallInstructions(result);
    }

    if (!spec.supports.vision) {
      result = this.stripImageContent(result);
    }

    result = this.normalizeSystemPrompts(result, spec);
    result = this.normalizeMessageRoles(result, spec);

    return result;
  }

  private stripToolCallInstructions(messages: ChatPayload["messages"]): ChatPayload["messages"] {
    return messages.map((m) => {
      if (m.role === "system") {
        let content = m.content;
        // Remove tool usage instructions
        content = content.replace(/[Uu]se tools to.+?(?=\n|$)/g, "");
        // Remove XML-style tool blocks
        content = content.replace(/<tools>[\s\S]*?<\/tools>/gi, "");
        // Remove function calling instructions
        content = content.replace(/\{[^}]*type[^}]*function[^}]*\}/g, "");
        return { ...m, content: content.trim() };
      }
      return m;
    });
  }

  private stripImageContent(messages: ChatPayload["messages"]): ChatPayload["messages"] {
    // For non-vision models, strip image URLs and content blocks
    return messages.map((m) => {
      if (m.role !== "system") {
        // In production, parse multi-part content and remove image parts
        // For now, just return as-is since messages are string-based
        return m;
      }
      return m;
    });
  }

  private normalizeSystemPrompts(messages: ChatPayload["messages"], spec: ModelSpec): ChatPayload["messages"] {
    // Normalize system prompts per provider requirements
    // Most providers handle system messages the same way
    // Specific normalization is done in provider implementations
    return messages;
  }

  private normalizeMessageRoles(messages: ChatPayload["messages"], spec: ModelSpec): ChatPayload["messages"] {
    // Most providers use standard role names (system, user, assistant)
    // No normalization needed at this layer
    return messages;
  }
}
