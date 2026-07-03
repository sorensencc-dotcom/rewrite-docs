import { Router, Request, Response } from 'express';
import {
  executePipeline,
  checkCICIntegration,
  selectModelByQuality,
  PipelineRequest,
} from '../handlers/pipeline';

const router = Router();

router.post('/person/:pid', async (req: Request, res: Response) => {
  try {
    const healthy = await checkCICIntegration();
    if (!healthy) {
      return res.status(503).json({
        error: 'CIC integration unavailable',
      });
    }

    const result = await executePipeline({
      action: 'query',
      adapter: 'familysearch',
      key: req.params.pid,
      context: req.body || {},
    });

    const selectedModel = await selectModelByQuality(result.quality);

    res.json({
      success: result.success,
      person: result.result,
      quality: result.quality,
      model: selectedModel,
      executionTime: result.executionTime,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const healthy = await checkCICIntegration();
    if (!healthy) {
      return res.status(503).json({
        error: 'CIC integration unavailable',
      });
    }

    const { adapter, key, context } = req.body;

    if (!adapter || !key) {
      return res.status(400).json({
        error: 'Missing required fields: adapter, key',
      });
    }

    const result = await executePipeline({
      action: 'analyze',
      adapter,
      key,
      context: context || {},
    });

    const selectedModel = await selectModelByQuality(result.quality);

    res.json({
      success: result.success,
      data: result.result,
      quality: result.quality,
      model: selectedModel,
      executionTime: result.executionTime,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

router.get('/health', async (req: Request, res: Response) => {
  try {
    const healthy = await checkCICIntegration();

    res.status(healthy ? 200 : 503).json({
      healthy,
      cic: {
        status: healthy ? 'connected' : 'disconnected',
        url: process.env.CIC_INGESTION_URL,
      },
    });
  } catch (error) {
    res.status(503).json({
      healthy: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
