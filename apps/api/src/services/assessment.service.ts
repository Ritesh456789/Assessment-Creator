import type { AssessmentDraft, QuestionTypeOption } from '@core/schemas/assessment';

import { AssessmentModel } from '../models/Assessment';
import { ExamPaperModel } from '../models/ExamPaper';
import { createAssessmentDraft, deleteAssessmentRecord, listAssessments, processAssessmentGeneration, queueAssessmentGeneration, toAssessmentSummary, updateAssessmentDraft } from './composer.service';
import { enqueueAssessmentGeneration } from '../queues/generation.queue';
import { env } from '../config/env';

export async function getQuestionTypes(questionTypes: QuestionTypeOption[]) {
	return questionTypes;
}

export async function createAssessment(input: { draft: AssessmentDraft; questionTypeCatalog: QuestionTypeOption[]; subject: string; className: string }) {
	const created = await createAssessmentDraft(input);
	return toAssessmentSummary(created as never);
}

export async function updateAssessment(assessmentId: string, input: { draft: AssessmentDraft; questionTypeCatalog: QuestionTypeOption[]; subject: string; className: string }) {
	const updated = await updateAssessmentDraft(assessmentId, input);
	return toAssessmentSummary(updated as never);
}

export async function deleteAssessment(assessmentId: string) {
	await deleteAssessmentRecord(assessmentId);
}

export { listAssessments };

export async function confirmAssessmentGeneration(assessmentId: string) {
	const assessment = await queueAssessmentGeneration(assessmentId);
	// If Redis is configured, try to enqueue a background job so a worker can pick it up.
	if (env.REDIS_URL) {
		try {
			await enqueueAssessmentGeneration(assessment._id.toString());
			console.log('Enqueued assessment generation job for', assessment._id.toString());
		} catch (err) {
			console.error('Failed to enqueue assessment generation job', err);
		}
	}
	// If a standalone worker is enabled and Redis is configured, do not process synchronously here.
	if (env.REDIS_URL && env.WORKER_ENABLED) {
		return {
			assessment: toAssessmentSummary(assessment as never),
			examPaper: null,
		};
	}
	// Fallback / default: process synchronously (preserves existing behaviour when worker not enabled)
	const examPaper = await processAssessmentGeneration(assessmentId);
	return {
		assessment: toAssessmentSummary(assessment as never),
		examPaper,
	};
}

export async function getAssessmentById(assessmentId: string) {
	const assessment = await AssessmentModel.findById(assessmentId).lean();
	if (!assessment) {
		return null;
	}

	return {
		id: assessment._id.toString(),
		title: assessment.title,
		subject: assessment.subject,
		className: assessment.className,
		dueDate: assessment.dueDate,
		instructions: assessment.instructions,
		sourceFileName: assessment.sourceFileName,
		questionTypes: assessment.questionTypes,
		status: assessment.status,
		stage: assessment.stage,
		progress: assessment.progress,
		progressMessage: assessment.progressMessage,
		generatedPaperId: assessment.generatedPaperId?.toString(),
	};
}

export async function getExamPaperByAssessmentId(assessmentId: string) {
	return ExamPaperModel.findOne({ assessmentId }).lean();
}

export async function regenerateAssessment(assessmentId: string) {
	await AssessmentModel.findByIdAndUpdate(assessmentId, {
		status: 'queued',
		stage: 'confirmation',
		progress: 10,
		progressMessage: 'Regeneration queued',
	});
	return processAssessmentGeneration(assessmentId);
}export {};
