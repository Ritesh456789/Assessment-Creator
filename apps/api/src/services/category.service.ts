import type { DifficultyLevel, QuestionTypeOption } from '@core/schemas/assessment';

import { cacheService } from './cache.service';
import { QuestionCategoryModel } from '../models/QuestionCategory';

const CACHE_KEY = 'question-categories:list';

export async function listQuestionCategories(): Promise<QuestionTypeOption[]> {
	const cached = cacheService.get<QuestionTypeOption[]>(CACHE_KEY);
	if (cached) {
		return cached;
	}

	const questionCategories = await QuestionCategoryModel.find({ active: true }).sort({ createdAt: 1 }).lean();
	const mapped = questionCategories.map((item) => ({
		type: item.key,
		label: item.label,
		description: item.description,
		defaultDifficulty: item.defaultDifficulty as DifficultyLevel,
		defaultMarksPerQuestion: item.defaultMarksPerQuestion,
		maxQuestions: item.maxQuestions ?? undefined,
	}));
	cacheService.set(CACHE_KEY, mapped, 5 * 60_000);
	return mapped;
}

export function invalidateQuestionCategoryCache() {
	cacheService.delete(CACHE_KEY);
}