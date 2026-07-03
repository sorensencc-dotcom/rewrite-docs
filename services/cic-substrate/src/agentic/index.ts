export * from './types';
export * from './events';
export * from './metrics';

import { createAgenticEventSink } from './events';
import { createAgenticMetricsClient } from './metrics';

export const agenticEventSink = createAgenticEventSink();
export const agenticMetricsClient = createAgenticMetricsClient();
