import type { AssessmentGenerationRequest, AssessmentStatus, AssessmentSummary, QuestionConfig, QuestionTypeOption, UploadedAssetPayload } from '@core/schemas/assessment';
import type { ExamPaper } from '@core/schemas/exam-paper';

import { AssessmentModel } from '../models/Assessment';
import { ExamPaperModel } from '../models/ExamPaper';
import { SourceDocumentModel } from '../models/SourceDocument';
import { broadcastSocketEvent } from '../config/socket';
import { createPaperPdfBuffer } from './exporter.service';
import { cacheService } from './cache.service';
import { generatePaperWithGemini } from '../adapters/gemini.adapter';

const PAPER_CACHE_PREFIX = 'exam-paper:';

function ensurePersistableAnswerKey(paper: ExamPaper): ExamPaper {
	const questions = paper.sections.flatMap((section) => section.questions);
	const questionsById = new Map(questions.map((question) => [question.id, question]));
	const answerKey = paper.answerKey?.length ? paper.answerKey : questions;

	return {
		...paper,
		answerKey: answerKey.map((entry, index) => {
			const question = questionsById.get(entry.id) ?? questions[index];
			return {
				id: entry.id || question?.id || `a-${index + 1}`,
				text: entry.text?.trim() || question?.text || `Question ${index + 1}`,
				marks: entry.marks ?? question?.marks ?? 1,
				difficulty: entry.difficulty ?? question?.difficulty ?? 'moderate',
				answer: entry.answer ?? question?.answer,
			};
		}),
	};
}

export function toAssessmentSummary(document: { _id: string; title: string; subject: string; className: string; dueDate: string; instructions: string; sourceFileName?: string; questionTypes: unknown[]; status: AssessmentStatus; createdAt: Date; progress?: number; generatedPaperId?: string }) : AssessmentSummary {
	return {
		id: document._id,
		title: document.title,
		subject: document.subject,
		className: document.className,
		dueDate: document.dueDate,
		instructions: document.instructions,
		sourceFileName: document.sourceFileName,
		questionTypes: document.questionTypes as AssessmentSummary['questionTypes'],
		status: document.status,
		createdAt: document.createdAt.toISOString(),
		progress: document.progress,
		generatedPaperId: document.generatedPaperId,
	};
}

export async function createAssessmentDraft(input: Omit<AssessmentGenerationRequest, 'questionTypeCatalog'> & { questionTypeCatalog: QuestionTypeOption[] }) {
	let sourceAssetId: string | undefined;
	if (input.draft.sourceAttachment) {
		const uploadedAsset = await persistUploadedAsset(input.draft.sourceAttachment);
		sourceAssetId = uploadedAsset._id.toString();
	}

	const created = await AssessmentModel.create({
		title: input.draft.title,
		subject: input.subject,
		className: input.className,
		dueDate: input.draft.dueDate,
		instructions: input.draft.instructions,
		sourceFileName: input.draft.sourceFileName,
		sourceAssetId,
		questionTypes: input.draft.questionTypes,
		status: 'draft',
		stage: 'builder',
		progress: 0,
		progressMessage: 'Draft saved',
		questionTypeSnapshot: input.questionTypeCatalog,
	});

	return created;
}

export async function updateAssessmentDraft(assessmentId: string, input: Omit<AssessmentGenerationRequest, 'questionTypeCatalog'> & { questionTypeCatalog: QuestionTypeOption[] }) {
	let sourceAssetId: string | undefined;
	if (input.draft.sourceAttachment) {
		const uploadedAsset = await persistUploadedAsset(input.draft.sourceAttachment);
		sourceAssetId = uploadedAsset._id.toString();
	}

	const updated = await AssessmentModel.findByIdAndUpdate(
		assessmentId,
		{
			title: input.draft.title,
			subject: input.subject,
			className: input.className,
			dueDate: input.draft.dueDate,
			instructions: input.draft.instructions,
			sourceFileName: input.draft.sourceFileName,
			sourceAssetId,
			questionTypes: input.draft.questionTypes,
			status: 'draft',
			stage: 'builder',
			progress: 0,
			progressMessage: 'Draft updated',
			questionTypeSnapshot: input.questionTypeCatalog,
		},
		{ new: true },
	);

	if (!updated) {
		throw new Error('Assessment not found');
	}

	return updated;
}

export async function listAssessments() {
	const assessments = await AssessmentModel.find().sort({ createdAt: -1 }).lean();
	return assessments.map((assessment) => toAssessmentSummary({
		...assessment,
		_id: assessment._id.toString(),
		sourceFileName: assessment.sourceFileName ?? undefined,
		generatedPaperId: assessment.generatedPaperId?.toString(),
		createdAt: assessment.createdAt,
	}));
}

export async function deleteAssessmentRecord(assessmentId: string) {
	const assessment = await AssessmentModel.findById(assessmentId);
	if (!assessment) {
		throw new Error('Assessment not found');
	}

	if (assessment.generatedPaperId) {
		cacheService.delete(`${PAPER_CACHE_PREFIX}${assessment.generatedPaperId.toString()}`);
	}

	await ExamPaperModel.deleteMany({ assessmentId });

	if (assessment.sourceAssetId) {
		await SourceDocumentModel.deleteOne({ _id: assessment.sourceAssetId });
	}

	await AssessmentModel.deleteOne({ _id: assessmentId });
}

async function persistUploadedAsset(asset: UploadedAssetPayload) {
	const payload = asset.dataUrl.includes(',') ? asset.dataUrl.split(',')[1] : asset.dataUrl;
	const buffer = Buffer.from(payload, 'base64');
	return SourceDocumentModel.create({
		fileName: asset.fileName,
		mimeType: asset.mimeType,
		sizeBytes: asset.sizeBytes,
		storageType: 'buffer',
		data: buffer,
		checksum: `${asset.fileName}:${asset.sizeBytes}:${buffer.length}`,
		context: 'assessment-upload',
	});
}

export async function queueAssessmentGeneration(assessmentId: string) {
	const assessment = await AssessmentModel.findByIdAndUpdate(
		assessmentId,
		{
			status: 'queued',
			stage: 'confirmation',
			progress: 10,
			progressMessage: 'Queued for generation',
			generationRequestedAt: new Date(),
		},
		{ new: true },
	);

	if (!assessment) {
		throw new Error('Assessment not found');
	}

	broadcastSocketEvent('assessment:queued', { assessmentId: assessment._id.toString() });
	return assessment;
}

export async function processAssessmentGeneration(assessmentId: string) {
	const assessment = await AssessmentModel.findById(assessmentId);
	if (!assessment) {
		throw new Error('Assessment not found');
	}

	try {
		await AssessmentModel.findByIdAndUpdate(assessmentId, { status: 'processing', stage: 'generating', progress: 20, progressMessage: 'Preparing prompt' });
		broadcastSocketEvent('assessment:processing', { assessmentId, progress: 20, progressMessage: 'Preparing prompt' });

		const questionTypeCatalog = Array.isArray(assessment.questionTypeSnapshot) ? (assessment.questionTypeSnapshot as QuestionTypeOption[]) : [];
		const request: AssessmentGenerationRequest = {
			draft: {
				title: assessment.title,
				subject: assessment.subject,
				className: assessment.className,
				dueDate: assessment.dueDate,
				instructions: assessment.instructions,
				sourceFileName: assessment.sourceFileName ?? undefined,
				questionTypes: assessment.questionTypes.map((item) => ({
					type: item.type,
					count: item.count,
					marksPerQuestion: item.marksPerQuestion,
					difficulty: item.difficulty as QuestionConfig['difficulty'],
				})) as QuestionConfig[],
			},
			questionTypeCatalog,
			subject: assessment.subject,
			className: assessment.className,
		};

		await AssessmentModel.findByIdAndUpdate(assessmentId, { progress: 40, progressMessage: 'Generating assessment content' });
		broadcastSocketEvent('assessment:processing', { assessmentId, progress: 40, progressMessage: 'Generating assessment content' });

		const examPaper = await generatePaperWithGemini(request);
		const normalizedPaper = ensurePersistableAnswerKey(examPaper);

		await AssessmentModel.findByIdAndUpdate(assessmentId, { progress: 75, progressMessage: 'Formatting output' });
		broadcastSocketEvent('assessment:processing', { assessmentId, progress: 75, progressMessage: 'Formatting output' });

		const paperDocument = await ExamPaperModel.create({
			assessmentId,
			title: normalizedPaper.title,
			subject: normalizedPaper.subject,
			className: normalizedPaper.className,
			totalMarks: normalizedPaper.totalMarks,
			totalTimeMinutes: normalizedPaper.totalTimeMinutes,
			sections: normalizedPaper.sections,
			answerKey: normalizedPaper.answerKey ?? [],
			notes: normalizedPaper.notes ?? [],
		});

		const pdfBuffer = await createPaperPdfBuffer(normalizedPaper as ExamPaper);
		cacheService.set(`${PAPER_CACHE_PREFIX}${paperDocument._id.toString()}`, pdfBuffer, 15 * 60_000);

		await AssessmentModel.findByIdAndUpdate(assessmentId, {
			status: 'completed',
			stage: 'ready',
			progress: 100,
			progressMessage: 'Assessment ready',
			generatedPaperId: paperDocument._id,
		});

		broadcastSocketEvent('assessment:completed', { assessmentId, paperId: paperDocument._id.toString() });
		return paperDocument;
	} catch (error) {
		const reason = error instanceof Error ? error.message : 'Assessment generation failed';
		await AssessmentModel.findByIdAndUpdate(assessmentId, {
			status: 'failed',
			stage: 'error',
			progress: 0,
			progressMessage: reason,
			lastError: reason,
		});
		broadcastSocketEvent('assessment:failed', { assessmentId, reason });
		throw error;
	}
}

export async function getPaperPdfBuffer(paperId: string) {
	return cacheService.get<Buffer>(`${PAPER_CACHE_PREFIX}${paperId}`);
}

export function clearPaperPdfBuffer(paperId: string) {
	cacheService.delete(`${PAPER_CACHE_PREFIX}${paperId}`);
}

export {};
