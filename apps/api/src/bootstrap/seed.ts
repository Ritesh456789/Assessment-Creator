import { DEFAULT_QUESTION_CATEGORIES } from '../config/default-question-categories';
import { AssessmentModel } from '../models/Assessment';
import { ExamPaperModel } from '../models/ExamPaper';
import { SourceDocumentModel } from '../models/SourceDocument';
import { QuestionCategoryModel } from '../models/QuestionCategory';

export async function seedDatabase() {
	await Promise.all([
		QuestionCategoryModel.createCollection(),
		AssessmentModel.createCollection(),
		ExamPaperModel.createCollection(),
		SourceDocumentModel.createCollection(),
	]);

	const existingCount = await QuestionCategoryModel.countDocuments();
	if (existingCount > 0) {
		return;
	}

	await QuestionCategoryModel.insertMany(
		DEFAULT_QUESTION_CATEGORIES.map((item) => ({
			key: item.type,
			label: item.label,
			description: item.description ?? '',
			defaultDifficulty: item.defaultDifficulty,
			defaultMarksPerQuestion: item.defaultMarksPerQuestion,
			maxQuestions: item.maxQuestions,
			active: true,
		})),
	);
}