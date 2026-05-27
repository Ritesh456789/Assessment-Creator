import http from 'node:http';

import { createApp } from './app';
import { env } from './config/env';
import { connectMongo } from './config/mongo';
import { connectRedis } from './config/redis';
import { attachSocketServer } from './config/socket';
import { seedDatabase } from './bootstrap/seed';

export async function startServer() {
	await connectMongo();
	await connectRedis();
	await seedDatabase();

	const app = createApp();
	const server = http.createServer(app);
	attachSocketServer(server);

	return await new Promise<http.Server>((resolve) => {
		server.listen(env.API_PORT, () => resolve(server));
	});
}export {};
