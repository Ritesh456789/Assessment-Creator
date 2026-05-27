import { sanitizeString, sanitizeText, sanitizeFilename, validateMimeType } from '@core/utils/sanitize';

/**
 * Frontend input sanitization hook for form handling
 */
export function useSanitization() {
	const sanitizeFormInput = (value: string, type: 'string' | 'text' = 'string'): string => {
		if (type === 'text') {
			return sanitizeText(value);
		}
		return sanitizeString(value);
	};

	const sanitizeAndValidateFile = (file: File): { valid: boolean; error?: string; filename?: string } => {
		const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
		const maxFileSizeMB = 10;

		// Validate file size
		if (file.size > maxFileSizeMB * 1024 * 1024) {
			return { valid: false, error: `File size exceeds ${maxFileSizeMB}MB limit` };
		}

		// Validate MIME type
		if (!validateMimeType(file.type, allowedMimeTypes)) {
			return { valid: false, error: 'Invalid file type. Allowed: JPEG, PNG, PDF, TXT' };
		}

		// Sanitize filename
		const sanitizedFilename = sanitizeFilename(file.name);

		return { valid: true, filename: sanitizedFilename };
	};

	const sanitizeFormData = (data: Record<string, any>): Record<string, any> => {
		const sanitized: Record<string, any> = {};

		for (const [key, value] of Object.entries(data)) {
			if (typeof value === 'string') {
				sanitized[key] = sanitizeString(value);
			} else if (typeof value === 'number') {
				sanitized[key] = value;
			} else if (typeof value === 'boolean') {
				sanitized[key] = value;
			} else if (Array.isArray(value)) {
				sanitized[key] = value.map((v) => (typeof v === 'string' ? sanitizeString(v) : v));
			} else if (value === null) {
				sanitized[key] = null;
			}
		}

		return sanitized;
	};

	return {
		sanitizeFormInput,
		sanitizeAndValidateFile,
		sanitizeFormData,
	};
}
