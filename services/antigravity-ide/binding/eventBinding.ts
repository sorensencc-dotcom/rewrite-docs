import { CoachEvent } from "../events";

export class EventBindingLayer {
  constructor(private setState: (s: any) => void) {}

  bind(client: any) {
    client.onEvent((event: CoachEvent) => {
      switch (event.type) {
        case "ROUTING_DECISION":
          this.setState({
            activePanel: "review",
            reviewData: {
              filePath: (event as any).filePath ?? "unknown",
              messages: event.messages
            }
          });
          break;

        case "READINESS_UPDATE":
          this.setState({ readiness: event.readinessIndex });
          break;

        case "DRIFT_ALERT":
          this.setState((state: any) => ({
            activePanel: "drift",
            driftData: [
              ...(state?.driftData ?? []),
              {
                timestamp: new Date().toISOString(),
                drift: event.driftIndex,
                contributors: event.contributors
              }
            ]
          }));
          break;

        case "RULE_VIOLATION":
          console.log("Rule violation:", event.ruleId, event.description);
          break;
      }
    });
  }
}
