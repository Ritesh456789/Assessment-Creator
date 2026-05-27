import type { WebSocketEventName, WebSocketServerEnvelope } from '@core/schemas/websocket';

type Listener = (event: WebSocketServerEnvelope<WebSocketEventName>) => void;

const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:4001/ws';

export function createWorkflowSocket(onMessage: Listener) {
	const normalizedUrl = wsUrl.endsWith('/ws') ? wsUrl : `${wsUrl.replace(/\/$/, '')}/ws`;
	const socket = new WebSocket(normalizedUrl);

	socket.addEventListener('message', (event) => {
		try {
			const parsed = JSON.parse(event.data as string) as WebSocketServerEnvelope<WebSocketEventName>;
			onMessage(parsed);
		} catch {
			// Ignore malformed messages.
		}
	});

	return socket;
}
