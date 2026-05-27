declare module 'pdfkit' {
	import { EventEmitter } from 'node:events';

	export default class PDFDocument extends EventEmitter {
		y: number;
		page: { margins: { left: number; right: number; top: number; bottom: number } };
		constructor(options?: Record<string, unknown>);
		font(name: string): this;
		fontSize(size: number): this;
		fillColor(color: string): this;
		text(text: string, options?: Record<string, unknown>): this;
		text(text: string, x: number, y: number, options?: Record<string, unknown>): this;
		moveDown(lines?: number): this;
		addPage(options?: Record<string, unknown>): this;
		end(): void;
	}
}

declare module 'ws' {
	import { EventEmitter } from 'node:events';

	export class WebSocket extends EventEmitter {
		static OPEN: number;
		readyState: number;
		send(data: string): void;
		close(): void;
		addEventListener(event: 'message' | 'close' | 'open', listener: (...args: unknown[]) => void): void;
	}

	export class WebSocketServer extends EventEmitter {
		constructor(options?: Record<string, unknown>);
		on(event: 'connection', listener: (socket: WebSocket) => void): this;
		close(): void;
	}
}
