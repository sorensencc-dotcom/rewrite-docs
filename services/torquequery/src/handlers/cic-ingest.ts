import axios from 'axios';

const CIC_INGESTION_URL = process.env.CIC_INGESTION_URL || 'http://localhost:3000';

interface IngestResult {
  adapter: string;
  success: boolean;
  data?: any;
  quality?: {
    driftSignals: any[];
    hydrationFailures: any[];
    hitRate: number;
  };
  timestamp: number;
}

interface BatchIngestResult {
  passed: number;
  failed: number;
  results: any[];
}

export async function ingestViaAdapter(
  adapterName: string,
  payload: any
): Promise<IngestResult> {
  try {
    const response = await axios.post(
      `${CIC_INGESTION_URL}/execute/${adapterName}`,
      payload,
      { timeout: 10000 }
    );

    return {
      adapter: adapterName,
      success: response.data.success,
      data: response.data.data,
      quality: {
        driftSignals: response.data.driftSignals || [],
        hydrationFailures: response.data.hydrationFailures || [],
        hitRate: response.data.stats?.hitRate || 0,
      },
      timestamp: Date.now(),
    };
  } catch (error) {
    throw new Error(
      `Adapter execution failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function batchIngest(
  adapterName: string,
  payloads: any[]
): Promise<BatchIngestResult> {
  try {
    const response = await axios.post(
      `${CIC_INGESTION_URL}/execute/batch/${adapterName}`,
      payloads,
      { timeout: 30000 }
    );

    return {
      passed: response.data.passed || 0,
      failed: response.data.failed || 0,
      results: response.data.results || [],
    };
  } catch (error) {
    throw new Error(
      `Batch execution failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function checkAdapterStatus(): Promise<any> {
  try {
    const response = await axios.get(`${CIC_INGESTION_URL}/execute/status`, {
      timeout: 5000,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      `Status check failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function invalidateCache(): Promise<any> {
  try {
    const response = await axios.post(
      `${CIC_INGESTION_URL}/execute/invalidate`,
      {},
      { timeout: 5000 }
    );
    return response.data;
  } catch (error) {
    throw new Error(
      `Cache invalidation failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
