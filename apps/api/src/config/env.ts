import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

const envCandidates = [
	resolve(process.cwd(), '.env'),
	resolve(process.cwd(), '..', '.env'),
	resolve(process.cwd(), '..', '..', '.env'),
];

for (const candidate of envCandidates) {
	if (existsSync(candidate)) {
		loadDotenv({ path: candidate, override: false });
	}
}

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
	API_PORT: z.coerce.number().int().positive().default(4001),
	MONGODB_URI: z.preprocess(
		(value) => {
			if (typeof value === 'string' && value.trim()) {
				return value.trim();
			}

			return process.env.MONGO_URI?.trim() || value;
		},
		z.string().min(1).default('mongodb://localhost:27017/assess-ai'),
	),
	REDIS_URL: z.string().min(1).optional(),
	GEMINI_API_KEY: z.string().optional(),
	GEMINI_MODEL: z.string().default('gemini-3.5-flash'),
	ASSESSMENT_STORAGE: z.enum(['database', 'memory']).default('database'),
	UPLOAD_MAX_MB: z.coerce.number().int().positive().default(10),
	CORS_ORIGIN: z.string().default('*'),
	WORKER_ENABLED: z.coerce.boolean().default(false),
});

export const env = envSchema.parse(process.env);

export type AppEnv = typeof env;
