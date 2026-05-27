export type WebSocketEventName =
	| 'assessment:queued'
	| 'assessment:processing'
	| 'assessment:completed'
	| 'assessment:failed';

export type WebSocketEventTopic = 'generation' | 'assessment';

export interface WebSocketEventPayloadMap {
	'assessment:queued': { assessmentId: string };
	'assessment:processing': { assessmentId: string; progress: number; progressMessage?: string };
	'assessment:completed': { assessmentId: string; paperId: string };
	'assessment:failed': { assessmentId: string; reason: string };
}

export interface WebSocketServerEnvelope<T extends WebSocketEventName> {
	type: T;
	data: WebSocketEventPayloadMap[T];
}
export {};
