import { GoogleGenerativeAI } from '@google/generative-ai';

import { env } from '../config/env';
import type { AssessmentGenerationRequest } from '@core/schemas/assessment';
import { buildStructuredAssessmentPrompt, extractJsonPayload, normalizeExamPaper } from '@core/workflow/assessment-generation';

async function analyzeReferenceDocument(dataUrl: string, mimeType: string): Promise<string> {
	if (!env.GEMINI_API_KEY) {
		throw new Error('GEMINI_API_KEY is required to analyze reference documents');
	}

	try {
		// Extract base64 from data URL
		const base64Data = dataUrl.split(',')[1];
		if (!base64Data) {
			return '';
		}

		const client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
		const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

		const response = await model.generateContent([
			{
				inlineData: {
					mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
					data: base64Data,
				},
			},
			{
				text: 'Analyze this question paper or document. Describe: (1) The overall structure and layout, (2) Types of questions asked, (3) Marking scheme pattern, (4) Language level and style, (5) Any special formatting or sections. Be concise.',
			},
		]);

		const analysis = response.response.text();
		return analysis || '';
	} catch (error) {
		// Provide a clearer message for network / API failures
		const msg = error instanceof Error ? error.message : String(error);
		console.error('Failed to analyze reference document (Gemini):', msg);
		throw new Error(`Gemini analysis failed: ${msg}`);
	}
}

export async function generatePaperWithGemini(request: AssessmentGenerationRequest) {
	if (!env.GEMINI_API_KEY) {
		throw new Error('GEMINI_API_KEY is required to generate an assessment');
	}

	// Analyze reference document if provided
	let referenceDocumentAnalysis = '';
	if (request.draft.sourceAttachment) {
		referenceDocumentAnalysis = await analyzeReferenceDocument(
			request.draft.sourceAttachment.dataUrl,
			request.draft.sourceAttachment.mimeType,
		);
	}

	const client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
	const model = client.getGenerativeModel({ model: env.GEMINI_MODEL });
	const structuredPrompt = buildStructuredAssessmentPrompt(request, env.GEMINI_MODEL, referenceDocumentAnalysis);

	try {
		const response = await model.generateContent(structuredPrompt.prompt);
		const rawText = response.response.text();
		const jsonPayload = extractJsonPayload(rawText);

		return normalizeExamPaper(JSON.parse(jsonPayload));
	} catch (error) {
		const msg = error instanceof Error ? error.message : String(error);
		console.error('Failed to generate paper with Gemini:', msg);
		throw new Error(`Gemini generation failed: ${msg}`);
	}
}

export {};
