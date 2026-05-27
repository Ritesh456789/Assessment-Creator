import express from 'express';
import cors from 'cors';

import { sanitizationMiddleware } from './middleware/sanitization.middleware';
import { env } from './config/env';
import { apiRouter } from './routes';

export function createApp() {
	const app = express();
	app.use(cors({ origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((item) => item.trim()) }));
	app.use(express.json({ limit: `${env.UPLOAD_MAX_MB}mb` }));
	app.use(sanitizationMiddleware);
	app.use('/api', apiRouter);

	app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
		const message = error instanceof Error ? error.message : 'Unknown server error';
		response.status(500).json({ message });
	});

	return app;
}export {};
