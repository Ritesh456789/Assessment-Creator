import { Worker, type Job } from 'bullmq';
import express from 'express';

import { env } from '../../api/src/config/env';
import { connectRedis, disconnectRedis, getRedisClient } from '../../api/src/config/redis';
import { connectMongo, disconnectMongo } from '../../api/src/config/mongo';
import { processAssessmentGeneration } from '../../api/src/services/composer.service';

async function startWorker() {
  console.log('Starting assess-ai worker...');

  try {
    // Connect to MongoDB
    await connectMongo();
    console.log('MongoDB connected');

    // Connect to Redis
    await connectRedis();
    const redis = getRedisClient();
    if (!redis) {
      console.error('REDIS_URL is not configured — worker requires Redis to run the queue. Exiting.');
      process.exit(1);
    }

    // --------------------------
    // HTTP server for Render health checks (web service requirement)
    const app = express();
    const PORT = process.env.PORT || 3000;
    app.get('/health', (_req, res) => {
      res.status(200).send('Worker is alive');
    });
    app.listen(PORT, () => {
      console.log(`Health check server listening on port ${PORT}`);
    });
    // --------------------------

    const worker = new Worker(
      'assessment-generation',
      async (job) => {
        const { assessmentId } = job.data as { assessmentId: string };
        console.log(`Worker: processing assessment ${assessmentId}`);
        try {
          await processAssessmentGeneration(assessmentId);
          console.log(`Worker: completed assessment ${assessmentId}`);
        } catch (err) {
          console.error('Worker: error processing assessment', err);
          throw err as Error;
        }
      },
      {
        connection: redis as any,
        concurrency: 1,
      },
    );

    worker.on('completed', (job: Job | undefined) => {
      console.log(`Job ${job?.id} completed`);
    });

    worker.on('failed', (job: Job | undefined, err: Error, prev?: string) => {
      console.error(`Job ${job?.id} failed:`, err, prev ? `prev=${prev}` : '');
    });

    const shutdown = async () => {
      console.log('Shutting down worker...');
      try {
        await worker.close();
      } catch (e) {
        console.error('Error closing worker', e);
      }
      try {
        await disconnectRedis();
      } catch (e) {
        console.error('Error disconnecting redis', e);
      }
      try {
        await disconnectMongo();
      } catch (e) {
        console.error('Error disconnecting mongo', e);
      }
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    console.log('Worker started and listening for jobs');
  } catch (error) {
    console.error('Failed to start worker', error);
    process.exit(1);
  }
}

startWorker();
