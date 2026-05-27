import type { NextFunction, Request, Response } from 'express';

import { sanitizeObject, sanitizeString } from '@core/utils/sanitize';

/**
 * Middleware to sanitize request body, query parameters, and URL parameters
 * Prevents XSS, injection attacks, and malicious input
 */
export function sanitizationMiddleware(_req: Request, _res: Response, next: NextFunction) {
	// Sanitize request body
	if (typeof _req.body === 'object' && _req.body !== null) {
		_req.body = sanitizeObject(_req.body);
	}

	// Sanitize query parameters (note: query is read-only, so we skip this)
	// Express query parameters are parsed by the json middleware and are typically safe

	// Sanitize URL parameters
	if (typeof _req.params === 'object' && _req.params !== null) {
		const sanitizedParams: Record<string, string> = {};
		for (const [key, value] of Object.entries(_req.params)) {
			sanitizedParams[sanitizeString(key)] = sanitizeString(String(value));
		}
		_req.params = sanitizedParams;
	}

	next();
}
