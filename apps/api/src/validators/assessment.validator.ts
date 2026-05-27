import { sanitizeString, sanitizeNumber } from '@core/utils/sanitize';

/**
 * Validate and sanitize assessment creation/update payload
 */
export function validateAssessmentPayload(data: any): {
	valid: boolean;
	error?: string;
	sanitized?: any;
} {
	if (!data || typeof data !== 'object') {
		return { valid: false, error: 'Invalid request payload' };
	}

	const { draft, subject, className } = data;

	// Validate subject
	if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
		return { valid: false, error: 'Subject is required and must be non-empty' };
	}

	// Validate className
	if (!className || typeof className !== 'string' || className.trim().length === 0) {
		return { valid: false, error: 'Class is required and must be non-empty' };
	}

	// Validate draft
	if (!draft || typeof draft !== 'object') {
		return { valid: false, error: 'Draft is required' };
	}

	const { title, dueDate, instructions, questionTypes } = draft;

	// Validate title
	if (!title || typeof title !== 'string' || title.trim().length === 0) {
		return { valid: false, error: 'Assessment title is required' };
	}

	if (title.length > 255) {
		return { valid: false, error: 'Assessment title is too long (max 255 characters)' };
	}

	// Validate dueDate format (should be YYYY-MM-DD or empty)
	if (dueDate && typeof dueDate === 'string') {
		const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
		if (!dateRegex.test(dueDate)) {
			return { valid: false, error: 'Invalid due date format. Use YYYY-MM-DD' };
		}
	}

	// Validate instructions
	if (instructions && typeof instructions !== 'string') {
		return { valid: false, error: 'Instructions must be a string' };
	}

	if (instructions && instructions.length > 5000) {
		return { valid: false, error: 'Instructions are too long (max 5000 characters)' };
	}

	// Validate questionTypes
	if (!Array.isArray(questionTypes) || questionTypes.length === 0) {
		return { valid: false, error: 'At least one question type is required' };
	}

	for (const qt of questionTypes) {
		if (typeof qt.count !== 'number' || qt.count < 1 || qt.count > 100) {
			return { valid: false, error: 'Question count must be between 1 and 100' };
		}

		if (typeof qt.marksPerQuestion !== 'number' || qt.marksPerQuestion < 1 || qt.marksPerQuestion > 100) {
			return { valid: false, error: 'Marks per question must be between 1 and 100' };
		}

		if (!qt.type || typeof qt.type !== 'string') {
			return { valid: false, error: 'Question type is required' };
		}
	}

	// Sanitize the payload
	const sanitized = {
		draft: {
			title: sanitizeString(title),
			subject: sanitizeString(subject),
			className: sanitizeString(className),
			dueDate: dueDate ? sanitizeString(dueDate) : '',
			instructions: instructions ? sanitizeString(instructions) : '',
			questionTypes: questionTypes.map((qt: any) => ({
				type: sanitizeString(qt.type),
				count: sanitizeNumber(qt.count, { min: 1, max: 100 }),
				marksPerQuestion: sanitizeNumber(qt.marksPerQuestion, { min: 1, max: 100 }),
				difficulty: qt.difficulty ? sanitizeString(qt.difficulty) : 'medium',
			})),
			sourceAttachment: draft.sourceAttachment ? {
				fileName: sanitizeString(draft.sourceAttachment.fileName),
				mimeType: sanitizeString(draft.sourceAttachment.mimeType),
				dataUrl: draft.sourceAttachment.dataUrl,
				sizeBytes: sanitizeNumber(draft.sourceAttachment.sizeBytes, { min: 0 }),
			} : undefined,
		},
		subject: sanitizeString(subject),
		className: sanitizeString(className),
	};

	return { valid: true, sanitized };
}

/**
 * Validate MongoDB ObjectId format
 */
export function isValidObjectId(id: string): boolean {
	return /^[a-f\d]{24}$/i.test(id);
}
