import axios from 'axios';

const CIC_INGESTION_URL = process.env.CIC_INGESTION_URL || 'http://localhost:3000';

export interface PipelineRequest {
  action: 'query' | 'analyze' | 'generate';
  adapter: string;
  key: string;
  context?: any;
}

export interface QualityMetrics {
  driftSignals: any[];
  hydrationFailures: any[];
  confidence: number;
}

export interface PipelineResponse {
  success: boolean;
  result: any;
  quality: QualityMetrics;
  executionTime: number;
}

export async function executePipeline(
  request: PipelineRequest
): Promise<PipelineResponse> {
  const startTime = Date.now();

  try {
    const adapterResult = await axios.post(
      `${CIC_INGESTION_URL}/execute/${request.adapter}`,
      {
        key: request.key,
        payload: request.context || {},
      },
      { timeout: 15000 }
    );

    const executionTime = Date.now() - startTime;

    const response: PipelineResponse = {
      success: adapterResult.data.success,
      result: adapterResult.data.data,
      quality: {
        driftSignals: adapterResult.data.driftSignals || [],
        hydrationFailures: adapterResult.data.hydrationFailures || [],
        confidence: adapterResult.data.stats?.hitRate || 0,
      },
      executionTime,
    };

    return response;
  } catch (error) {
    throw error;
  }
}

export async function checkCICIntegration(): Promise<boolean> {
  try {
    const response = await axios.get(`${CIC_INGESTION_URL}/execute/status`, {
      timeout: 5000,
    });

    return response.data.healthy === true || response.status === 200;
  } catch (error) {
    return false;
  }
}

export async function selectModelByQuality(quality: QualityMetrics): Promise<string> {
  const { confidence, driftSignals, hydrationFailures } = quality;

  if (hydrationFailures.length > 0) {
    return 'gpt-4-fallback';
  }

  if (driftSignals.length > 0) {
    return 'claude-3-opus';
  }

  if (confidence < 0.3) {
    return 'claude-3-sonnet';
  }

  if (confidence < 0.6) {
    return 'claude-3-haiku';
  }

  return 'claude-3-sonnet';
}
