import type { AssessmentDraft, AssessmentSummary, QuestionTypeOption, UploadedAssetPayload } from '@core/schemas/assessment';
import type { ExamPaper } from '@core/schemas/exam-paper';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001/api';

function buildUrl(path: string) {
	return new URL(path.replace(/^\//, ''), `${apiBaseUrl.replace(/\/$/, '')}/`).toString();
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(buildUrl(path), {
		...init,
		headers: {
			'Content-Type': 'application/json',
			...(init?.headers ?? {}),
		},
	});

	if (!response.ok) {
		throw new Error(await response.text());
	}

	return (await response.json()) as T;
}

export async function fetchQuestionCategories() {
	const response = await requestJson<{ questionTypes: QuestionTypeOption[] }>('/assessments/question-categories');
	return response.questionTypes;
}

export async function fetchAssessments() {
	const response = await requestJson<{ assessments: AssessmentSummary[] }>('/assessments');
	return response.assessments;
}

export async function createAssessmentDraft(payload: {
	draft: AssessmentDraft;
	subject: string;
	className: string;
}) {
	return requestJson<{ assessment: AssessmentSummary }>('/assessments', {
		method: 'POST',
		body: JSON.stringify(payload),
	});
}

export async function updateAssessmentDraft(assessmentId: string, payload: {
	draft: AssessmentDraft;
	subject: string;
	className: string;
}) {
	return requestJson<{ assessment: AssessmentSummary }>(`/assessments/${assessmentId}`, {
		method: 'PUT',
		body: JSON.stringify(payload),
	});
}

export async function deleteAssessment(assessmentId: string) {
	const response = await fetch(buildUrl(`/assessments/${assessmentId}`), { method: 'DELETE' });
	if (!response.ok) {
		throw new Error(await response.text());
	}
}

export async function confirmAssessmentGeneration(assessmentId: string) {
	return requestJson<{ assessment: AssessmentSummary; generatedPaper: ExamPaper }>(`/assessments/${assessmentId}/confirm`, {
		method: 'POST',
	});
}

export async function getAssessment(assessmentId: string) {
	return requestJson<{ assessment: AssessmentSummary & { generatedPaperId?: string; progress?: number; progressMessage?: string; stage?: string } }>(`/assessments/${assessmentId}`);
}

export async function getExamPaper(assessmentId: string) {
	return requestJson<{ paper: ExamPaper }>(`/assessments/${assessmentId}/paper`);
}

export async function regenerateAssessment(assessmentId: string) {
	return requestJson<{ paper: ExamPaper }>(`/assessments/${assessmentId}/regenerate`, {
		method: 'POST',
	});
}

export function getAssessmentPdfUrl(assessmentId: string) {
	return buildUrl(`/assessments/${assessmentId}/pdf`);
}

export function serializeAttachment(asset: UploadedAssetPayload | null) {
	return asset
		? {
			fileName: asset.fileName,
			mimeType: asset.mimeType,
			dataUrl: asset.dataUrl,
			sizeBytes: asset.sizeBytes,
		}
		: null;
}
