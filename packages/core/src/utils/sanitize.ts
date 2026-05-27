/**
 * Input Sanitization Utilities
 * Prevents XSS, injection attacks, and malicious input
 */

/**
 * Sanitize string input: trim, remove control characters, escape HTML entities
 */
export function sanitizeString(input: unknown): string {
	if (typeof input !== 'string') {
		return '';
	}

	return (
		input
			.trim()
			// Remove control characters (except newlines and tabs)
			.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
			// Escape HTML special characters
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#x27;')
	);
}

/**
 * Sanitize plain text (minimal escaping, preserve formatting)
 */
export function sanitizeText(input: unknown): string {
	if (typeof input !== 'string') {
		return '';
	}

	return input
		.trim()
		// Remove null bytes and control characters
		.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(input: unknown): string {
	if (typeof input !== 'string') {
		return '';
	}

	const email = input.trim().toLowerCase();
	// Basic email validation
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	return emailRegex.test(email) ? email : '';
}

/**
 * Sanitize URL to prevent javascript: and data: URLs
 */
export function sanitizeUrl(input: unknown): string {
	if (typeof input !== 'string') {
		return '';
	}

	const url = input.trim();
	const lowerUrl = url.toLowerCase();

	// Block dangerous protocols
	if (
		lowerUrl.startsWith('javascript:') ||
		lowerUrl.startsWith('data:') ||
		lowerUrl.startsWith('vbscript:')
	) {
		return '';
	}

	return url;
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: unknown, options?: { min?: number; max?: number }): number {
	const num = Number(input);

	if (isNaN(num)) {
		return 0;
	}

	if (options?.min !== undefined && num < options.min) {
		return options.min;
	}

	if (options?.max !== undefined && num > options.max) {
		return options.max;
	}

	return num;
}

/**
 * Sanitize array of strings (maps sanitizeString to each element)
 */
export function sanitizeStringArray(input: unknown[]): string[] {
	if (!Array.isArray(input)) {
		return [];
	}

	return input.map((item) => sanitizeString(item));
}

/**
 * Validate filename: prevent directory traversal and dangerous characters
 */
export function sanitizeFilename(input: unknown): string {
	if (typeof input !== 'string') {
		return 'file';
	}

	return (
		input
			// Remove path separators and traversal attempts
			.replace(/\.\./g, '')
			.replace(/[\/\\]/g, '')
			// Remove dangerous characters
			.replace(/[<>:"|?*\x00-\x1F]/g, '')
			// Limit length
			.substring(0, 255)
			.trim() || 'file'
	);
}

/**
 * Validate MIME type against whitelist
 */
export function validateMimeType(
	mimeType: unknown,
	allowedTypes: string[] = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain']
): boolean {
	if (typeof mimeType !== 'string') {
		return false;
	}

	return allowedTypes.includes(mimeType.toLowerCase());
}

/**
 * Sanitize object keys and values recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: unknown): Partial<T> {
	if (typeof obj !== 'object' || obj === null) {
		return {};
	}

	// Handle arrays
	if (Array.isArray(obj)) {
		return obj.map((item) => sanitizeObject(item)) as any;
	}

	const sanitized: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(obj)) {
		// Sanitize key
		const safeKey = sanitizeString(key);

		// Sanitize value based on type
		if (typeof value === 'string') {
			sanitized[safeKey] = sanitizeString(value);
		} else if (typeof value === 'number') {
			sanitized[safeKey] = value;
		} else if (typeof value === 'boolean') {
			sanitized[safeKey] = value;
		} else if (value === null) {
			sanitized[safeKey] = null;
		} else if (typeof value === 'object' && value !== null) {
			// Recursively sanitize nested objects and arrays
			sanitized[safeKey] = sanitizeObject(value);
		}
	}

	return sanitized as Partial<T>;
}
