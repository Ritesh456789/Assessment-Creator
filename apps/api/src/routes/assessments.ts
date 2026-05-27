import { Router } from 'express';

import {
	handleConfirmAssessment,
	handleCreateAssessment,
	handleDeleteAssessment,
	handleGetAssessment,
	handleGetExamPaper,
	handleGetExamPaperPdf,
	handleListQuestionCategories,
	handleListAssessments,
	handleRegenerateAssessment,
	handleUpdateAssessment,
} from '../controllers/assessments.controller';

export const assessmentsRouter = Router();

assessmentsRouter.get('/question-categories', handleListQuestionCategories);
assessmentsRouter.get('/', handleListAssessments);
assessmentsRouter.post('/', handleCreateAssessment);
assessmentsRouter.put('/:assessmentId', handleUpdateAssessment);
assessmentsRouter.delete('/:assessmentId', handleDeleteAssessment);
assessmentsRouter.post('/:assessmentId/confirm', handleConfirmAssessment);
assessmentsRouter.get('/:assessmentId', handleGetAssessment);
assessmentsRouter.get('/:assessmentId/paper', handleGetExamPaper);
assessmentsRouter.get('/:assessmentId/pdf', handleGetExamPaperPdf);
assessmentsRouter.post('/:assessmentId/regenerate', handleRegenerateAssessment);export {};
