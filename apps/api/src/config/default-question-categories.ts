import type { QuestionTypeOption } from '@core/schemas/assessment';

export const DEFAULT_QUESTION_CATEGORIES: QuestionTypeOption[] = [
	{
		type: 'multiple-choice-questions',
		label: 'Multiple Choice Questions',
		description: 'Single answer objective questions.',
		defaultDifficulty: 'easy',
		defaultMarksPerQuestion: 1,
		maxQuestions: 20,
	},
	{
		type: 'short-questions',
		label: 'Short Questions',
		description: 'Concise responses and recall checks.',
		defaultDifficulty: 'moderate',
		defaultMarksPerQuestion: 2,
		maxQuestions: 15,
	},
	{
		type: 'diagram-graph-based-questions',
		label: 'Diagram/Graph-Based Questions',
		description: 'Visual interpretation and explanation.',
		defaultDifficulty: 'moderate',
		defaultMarksPerQuestion: 5,
		maxQuestions: 10,
	},
	{
		type: 'numerical-problems',
		label: 'Numerical Problems',
		description: 'Calculation and application tasks.',
		defaultDifficulty: 'hard',
		defaultMarksPerQuestion: 5,
		maxQuestions: 10,
	},
];
