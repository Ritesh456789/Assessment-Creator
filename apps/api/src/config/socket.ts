import type { Server } from 'node:http';

import { WebSocket, WebSocketServer, type WebSocket as WsClient } from 'ws';

import type { WebSocketEventName, WebSocketEventPayloadMap, WebSocketServerEnvelope } from '@core/schemas/websocket';

let socketServer: WebSocketServer | null = null;
const socketClients = new Set<WsClient>();

export function attachSocketServer(server: Server) {
	if (socketServer) {
		return socketServer;
	}

	socketServer = new WebSocketServer({ server, path: '/ws' });
	socketServer.on('connection', (socket) => {
		socketClients.add(socket);
		socket.on('close', () => socketClients.delete(socket));
	});

	return socketServer;
}

export function broadcastSocketEvent<T extends WebSocketEventName>(type: T, data: WebSocketEventPayloadMap[T]) {
	const payload: WebSocketServerEnvelope<T> = { type, data };
	const message = JSON.stringify(payload);
	for (const client of socketClients) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(message);
		}
	}
}

export function closeSocketServer() {
	socketClients.clear();
	socketServer?.close();
	socketServer = null;
}
