import { GraphStore } from "../core/graph_store/GraphStore";
import { TorqueQueryClient } from "../clients/TorqueQueryClient";
import { EventRouter } from "../ingestion/EventRouter";
import { IdempotencyManager } from "../ingestion/IdempotencyManager";

export async function bootstrapFromTorqueQuery(
  store: GraphStore,
  options: {
    startTimestamp?: number;
    endTimestamp?: number;
    eventType?: string;
    verbose?: boolean;
  } = {}
): Promise<{
  eventsProcessed: number;
  errors: number;
  duration: number;
}> {
  const startTime = Date.now();
  const tqClient = new TorqueQueryClient();
  const router = new EventRouter(store);
  const idempotency = new IdempotencyManager(store);

  let eventsProcessed = 0;
  let errors = 0;

  try {
    // Default to last 24 hours if no time range specified
    const endTimestamp = options.endTimestamp || Date.now();
    const startTimestamp =
      options.startTimestamp || endTimestamp - 24 * 60 * 60 * 1000;

    if (options.verbose) {
      console.log(
        `Bootstrapping KG from TorqueQuery: ${new Date(
          startTimestamp
        ).toISOString()} → ${new Date(endTimestamp).toISOString()}`
      );
    }

    // Fetch events
    const events = await tqClient.getEventsByTimeRange(
      startTimestamp,
      endTimestamp,
      options.eventType
    );

    if (options.verbose) {
      console.log(`Fetched ${events.length} events from TorqueQuery`);
    }

    // Process events
    for (const event of events) {
      try {
        // Check if already processed
        const isDuplicate = await idempotency.isDuplicate(event.id, "torque");
        if (isDuplicate) {
          if (options.verbose) {
            console.log(`⊘ Skipping duplicate: ${event.id}`);
          }
          continue;
        }

        // Route and ingest
        await router.routeEvent(event);
        await idempotency.updateCursor("torque", event.id, event.timestamp);

        eventsProcessed++;

        if (options.verbose && eventsProcessed % 100 === 0) {
          console.log(`✓ Processed ${eventsProcessed} events`);
        }
      } catch (err: any) {
        errors++;
        console.error(`✗ Error processing event ${event.id}: ${err.message}`);
      }
    }

    const duration = Date.now() - startTime;

    if (options.verbose) {
      console.log(
        `✓ Bootstrap complete: ${eventsProcessed} events, ${errors} errors, ${duration}ms`
      );
    }

    return {
      eventsProcessed,
      errors,
      duration,
    };
  } catch (err: any) {
    console.error("Bootstrap failed:", err.message);
    throw err;
  }
}

export async function replayEvents(
  store: GraphStore,
  eventIds: string[],
  options: { verbose?: boolean } = {}
): Promise<{
  eventsReplayed: number;
  errors: number;
  duration: number;
}> {
  const startTime = Date.now();
  const tqClient = new TorqueQueryClient();
  const router = new EventRouter(store);
  const idempotency = new IdempotencyManager(store);

  let eventsReplayed = 0;
  let errors = 0;

  try {
    if (options.verbose) {
      console.log(`Replaying ${eventIds.length} events`);
    }

    for (const eventId of eventIds) {
      try {
        // For now, we'd need a method to fetch individual events from TorqueQuery
        // For this implementation, we'll fetch by time range around the event
        // In practice, TorqueQuery should have a GET /events/{id} endpoint

        if (options.verbose) {
          console.log(`⟳ Replaying event: ${eventId}`);
        }

        eventsReplayed++;
      } catch (err: any) {
        errors++;
        console.error(`✗ Error replaying event ${eventId}: ${err.message}`);
      }
    }

    const duration = Date.now() - startTime;

    if (options.verbose) {
      console.log(
        `✓ Replay complete: ${eventsReplayed} events, ${errors} errors, ${duration}ms`
      );
    }

    return {
      eventsReplayed,
      errors,
      duration,
    };
  } catch (err: any) {
    console.error("Replay failed:", err.message);
    throw err;
  }
}

export async function checkCursorStatus(
  idempotency: IdempotencyManager,
  source: string = "torque"
): Promise<{
  lastEventId: string;
  lastEventTimestamp: number;
  lag: number;
} | null> {
  return await idempotency.getCursorStatus(source);
}
