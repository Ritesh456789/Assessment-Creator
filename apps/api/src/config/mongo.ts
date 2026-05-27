import mongoose from 'mongoose';

import { env } from './env';

let hasConnected = false;

export async function connectMongo() {
	if (hasConnected) {
		return mongoose.connection;
	}

	mongoose.set('strictQuery', true);
	await mongoose.connect(env.MONGODB_URI, { autoIndex: true });
	hasConnected = true;
	return mongoose.connection;
}

export async function ensureMongoConnection() {
	if (mongoose.connection.readyState === 1) {
		return mongoose.connection;
	}

	return connectMongo();
}

export async function disconnectMongo() {
	if (mongoose.connection.readyState !== 0) {
		await mongoose.disconnect();
	}
	hasConnected = false;
}
