import type { DifficultyLevel } from './assessment';

export interface GeneratedQuestion {
	id: string;
	text: string;
	marks: number;
	difficulty: DifficultyLevel;
	answer?: string;
}

export interface GeneratedSection {
	title: string;
	instruction: string;
	questions: GeneratedQuestion[];
}

export interface ExamPaper {
	title: string;
	subject: string;
	className: string;
	totalMarks: number;
	totalTimeMinutes: number;
	sections: GeneratedSection[];
	answerKey?: GeneratedQuestion[];
	notes?: string[];
}
export {};
