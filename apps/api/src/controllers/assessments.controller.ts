import type { Request, Response } from 'express';

import { validateAssessmentPayload, isValidObjectId } from '../validators/assessment.validator';
import { listQuestionCategories } from '../services/category.service';
import { confirmAssessmentGeneration, createAssessment, deleteAssessment, getAssessmentById, getExamPaperByAssessmentId, listAssessments, regenerateAssessment, updateAssessment } from '../services/assessment.service';
import { getPaperPdfBuffer } from '../services/composer.service';
import { createPaperPdfBuffer } from '../services/exporter.service';

export async function handleListQuestionCategories(_: Request, response: Response) {
	const questionCategories = await listQuestionCategories();
	response.json({ questionTypes: questionCategories });
}

export async function handleListAssessments(_: Request, response: Response) {
	const assessments = await listAssessments();
	response.json({ assessments });
}

export async function handleCreateAssessment(request: Request, response: Response) {
	try {
		// Validate input
		const validation = validateAssessmentPayload(request.body);
		if (!validation.valid) {
			response.status(400).json({ message: validation.error });
			return;
		}

		const questionTypeCatalog = await listQuestionCategories();
		const created = await createAssessment({
			draft: validation.sanitized!.draft,
			questionTypeCatalog,
			subject: validation.sanitized!.subject,
			className: validation.sanitized!.className,
		});
		response.status(201).json({ assessment: created });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to create assessment';
		response.status(500).json({ message });
	}
}

export async function handleUpdateAssessment(request: Request, response: Response) {
	try {
		const assessmentId = Array.isArray(request.params.assessmentId) ? request.params.assessmentId[0] : request.params.assessmentId;
		// Validate ObjectId
		if (!isValidObjectId(assessmentId)) {
			response.status(400).json({ message: 'Invalid assessment ID' });
			return;
		}

		// Validate input
		const validation = validateAssessmentPayload(request.body);
		if (!validation.valid) {
			response.status(400).json({ message: validation.error });
			return;
		}

		const questionTypeCatalog = await listQuestionCategories();
		const updated = await updateAssessment(assessmentId, {
			draft: validation.sanitized!.draft,
			questionTypeCatalog,
			subject: validation.sanitized!.subject,
			className: validation.sanitized!.className,
		});
		response.json({ assessment: updated });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to update assessment';
		response.status(500).json({ message });
	}
}

export async function handleDeleteAssessment(request: Request, response: Response) {
	try {
		const assessmentId = Array.isArray(request.params.assessmentId) ? request.params.assessmentId[0] : request.params.assessmentId;
		// Validate ObjectId
		if (!isValidObjectId(assessmentId)) {
			response.status(400).json({ message: 'Invalid assessment ID' });
			return;
		}

		await deleteAssessment(assessmentId);
		response.status(204).send();
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unable to delete assessment';
		response.status(message === 'Assessment not found' ? 404 : 500).json({ message });
	}
}

export async function handleConfirmAssessment(request: Request, response: Response) {
	try {
		const assessmentId = Array.isArray(request.params.assessmentId) ? request.params.assessmentId[0] : request.params.assessmentId;
		// Validate ObjectId
		if (!isValidObjectId(assessmentId)) {
			response.status(400).json({ message: 'Invalid assessment ID' });
			return;
		}

		const { assessment, examPaper } = await confirmAssessmentGeneration(assessmentId);
		response.json({ assessment, generatedPaper: examPaper });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Assessment generation failed';
		response.status(503).json({ message });
	}
}

export async function handleGetAssessment(request: Request, response: Response) {
	try {
		const assessmentId = Array.isArray(request.params.assessmentId) ? request.params.assessmentId[0] : request.params.assessmentId;
		// Validate ObjectId
		if (!isValidObjectId(assessmentId)) {
			response.status(400).json({ message: 'Invalid assessment ID' });
			return;
		}

		const assessment = await getAssessmentById(assessmentId);
		if (!assessment) {
			response.status(404).json({ message: 'Assessment not found' });
			return;
		}

		response.json({ assessment });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to get assessment';
		response.status(500).json({ message });
	}
}

export async function handleGetExamPaper(request: Request, response: Response) {
	try {
		const assessmentId = Array.isArray(request.params.assessmentId) ? request.params.assessmentId[0] : request.params.assessmentId;
		// Validate ObjectId
		if (!isValidObjectId(assessmentId)) {
			response.status(400).json({ message: 'Invalid assessment ID' });
			return;
		}

		const paper = await getExamPaperByAssessmentId(assessmentId);
		if (!paper) {
			response.status(404).json({ message: 'Generated paper not found' });
			return;
		}

		response.json({ paper });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to get paper';
		response.status(500).json({ message });
	}
}

export async function handleGetExamPaperPdf(request: Request, response: Response) {
	try {
		const assessmentId = Array.isArray(request.params.assessmentId) ? request.params.assessmentId[0] : request.params.assessmentId;
		// Validate ObjectId
		if (!isValidObjectId(assessmentId)) {
			response.status(400).json({ message: 'Invalid assessment ID' });
			return;
		}

		const paper = await getExamPaperByAssessmentId(assessmentId);
		if (!paper) {
			response.status(404).json({ message: 'Generated paper not found' });
			return;
		}

		const buffer = (await getPaperPdfBuffer(paper._id.toString())) ?? (await createPaperPdfBuffer(paper as never));
		response.setHeader('Content-Type', 'application/pdf');
		response.setHeader('Content-Disposition', `attachment; filename="${paper.title.replace(/\s+/g, '-').toLowerCase()}.pdf"`);
		response.send(buffer);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to generate PDF';
		response.status(500).json({ message });
	}
}

export async function handleRegenerateAssessment(request: Request, response: Response) {
	try {
		const assessmentId = Array.isArray(request.params.assessmentId) ? request.params.assessmentId[0] : request.params.assessmentId;
		// Validate ObjectId
		if (!isValidObjectId(assessmentId)) {
			response.status(400).json({ message: 'Invalid assessment ID' });
			return;
		}

		const paper = await regenerateAssessment(assessmentId);
		response.json({ paper });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Assessment regeneration failed';
		response.status(503).json({ message });
	}
}

export {};
