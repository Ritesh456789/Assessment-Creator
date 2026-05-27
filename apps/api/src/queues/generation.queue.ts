import { Queue } from 'bullmq';

import { env } from '../config/env';
import { getRedisClient } from '../config/redis';

const redisClient = getRedisClient();

export const generationQueue = env.REDIS_URL && redisClient
	? new Queue('assessment-generation', {
		connection: redisClient,
	})
	: null;

export async function enqueueAssessmentGeneration(assessmentId: string) {
	if (!generationQueue) {
		return false;
	}

	await generationQueue.add('generate', { assessmentId }, { removeOnComplete: true, removeOnFail: false });
	return true;
}export {};
