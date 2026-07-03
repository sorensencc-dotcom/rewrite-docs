export interface CommandRegistry {
  registerCommand(id: string, handler: () => void): void;
}

export function registerCoachCommands(registry: CommandRegistry, actions: {
  reviewCode: () => void;
  applyLocalFixes: () => void;
  showRoutingSummary: () => void;
}) {
  registry.registerCommand("coach.reviewCode", actions.reviewCode);
  registry.registerCommand("coach.applyLocalFixes", actions.applyLocalFixes);
  registry.registerCommand("coach.showRoutingSummary", actions.showRoutingSummary);
}
