import type {
	AssessmentDraft,
	AssessmentGenerationRequest,
	DifficultyLevel,
	QuestionTypeOption,
} from '../schemas/assessment';
import type { ExamPaper, GeneratedQuestion, GeneratedSection } from '../schemas/exam-paper';

type StructuredQuestionItem = {
	question: string;
	marks: number;
	difficulty: DifficultyLevel;
	answer?: string;
};

type StructuredSection = {
	title: string;
	instruction: string;
	questions: StructuredQuestionItem[];
};

export interface StructuredAssessmentPrompt {
	model: string;
	prompt: string;
	questionTypeCatalog: QuestionTypeOption[];
	jsonSchemaHint: string;
}

export function buildStructuredAssessmentPrompt(request: AssessmentGenerationRequest, model = 'gemini-3.5-flash', referenceDocumentAnalysis = ''): StructuredAssessmentPrompt {
	const { draft, questionTypeCatalog, subject, className } = request;
	const promptLines = [
		'You are an expert school assessment writer.',
		'Create a properly structured question paper as valid JSON only.',
		'No markdown, no code fences, no commentary.',
		`Subject: ${subject}`,
		`Class: ${className}`,
		`Title: ${draft.title}`,
		`Due date: ${draft.dueDate}`,
		`Instructions: ${draft.instructions}`,
		`Question types: ${draft.questionTypes.map((item) => `${item.type} x${item.count} (${item.marksPerQuestion} marks, ${item.difficulty})`).join('; ')}`,
		`Available catalog: ${questionTypeCatalog.map((item) => `${item.label}:${item.defaultDifficulty}:${item.defaultMarksPerQuestion}`).join(' | ')}`,
		'Output schema: { title, subject, className, totalMarks, totalTimeMinutes, sections: [{ title, instruction, questions: [{ id, text, marks, difficulty, answer }]}], answerKey: [{ id, text, marks, difficulty, answer }], notes?: [string] }',
		'Set each section title to its question type label, such as "Short Answer Questions"; the paper renderer adds Section A, Section B, and so on.',
		'Include a concise classroom-ready suggested answer for every question in both sections and answerKey.',
		'Keep difficulty visually balanced.',
		'Prefer concise, classroom-ready language.',
	];

	if (referenceDocumentAnalysis) {
		promptLines.push('---');
		promptLines.push('REFERENCE DOCUMENT ANALYSIS:');
		promptLines.push('Match the structure, style, and format of the uploaded reference document while meeting the question type requirements above.');
		promptLines.push('Reference document details:');
		promptLines.push(referenceDocumentAnalysis);
		promptLines.push('---');
	}

	return {
		model,
		prompt: promptLines.join('\n'),
		questionTypeCatalog,
		jsonSchemaHint: 'Return strict JSON matching the paper schema.',
	};
}

export function extractJsonPayload(text: string): string {
	const trimmed = text.trim();
	if (trimmed.startsWith('{')) {
		return trimmed;
	}

	const firstBrace = trimmed.indexOf('{');
	const lastBrace = trimmed.lastIndexOf('}');
	if (firstBrace >= 0 && lastBrace > firstBrace) {
		return trimmed.slice(firstBrace, lastBrace + 1);
	}

	return trimmed;
}

type RawGeneratedQuestion = Partial<GeneratedQuestion> & {
	question?: string;
	questionText?: string;
};

type RawGeneratedSection = Partial<GeneratedSection> & { questions?: RawGeneratedQuestion[] };

function getQuestionText(question: RawGeneratedQuestion, fallback: string) {
	return question.text?.trim() || question.question?.trim() || question.questionText?.trim() || fallback;
}

export function normalizeExamPaper(raw: Partial<ExamPaper> & { sections?: RawGeneratedSection[]; answerKey?: RawGeneratedQuestion[] }): ExamPaper {
	const sections = (raw.sections ?? []).map((section: RawGeneratedSection, sectionIndex: number) => ({
		title: section.title ?? `Section ${String.fromCharCode(65 + sectionIndex)}`,
		instruction: section.instruction ?? 'Attempt all questions carefully.',
		questions: (section.questions ?? []).map((question: RawGeneratedQuestion, questionIndex: number) => ({
			id: question.id ?? `q-${sectionIndex + 1}-${questionIndex + 1}`,
			text: getQuestionText(question, 'Question text'),
			marks: question.marks ?? 1,
			difficulty: question.difficulty ?? 'moderate',
			answer: question.answer,
		})),
	}));
	const sectionQuestions = sections.flatMap((section) => section.questions);

	const totalMarks = raw.totalMarks ?? sections.reduce((sum: number, section: GeneratedSection) => sum + section.questions.reduce((inner: number, question: GeneratedQuestion) => inner + question.marks, 0), 0);
	const answerKeySource = raw.answerKey?.length ? raw.answerKey : sectionQuestions;

	return {
		title: raw.title ?? 'Generated Question Paper',
		subject: raw.subject ?? 'General',
		className: raw.className ?? 'Class',
		totalMarks,
		totalTimeMinutes: raw.totalTimeMinutes ?? Math.max(30, Math.ceil(totalMarks * 2)),
		sections,
		answerKey: answerKeySource.map((question: RawGeneratedQuestion, index: number) => ({
			id: question.id ?? `a-${index + 1}`,
			text: getQuestionText(question, sectionQuestions[index]?.text || `Question ${index + 1}`),
			marks: question.marks ?? 1,
			difficulty: question.difficulty ?? 'moderate',
			answer: question.answer,
		})),
		notes: raw.notes ?? [],
	};
}

export function estimateGenerationTime(request: AssessmentGenerationRequest): number {
	const questionCount = request.draft.questionTypes.reduce((sum, item) => sum + item.count, 0);
	return Math.max(30, Math.min(120, questionCount * 3 + 12));
}

export function calculateTotals(draft: AssessmentDraft): { totalQuestions: number; totalMarks: number } {
	return draft.questionTypes.reduce(
		(accumulator, item) => ({
			totalQuestions: accumulator.totalQuestions + item.count,
			totalMarks: accumulator.totalMarks + item.count * item.marksPerQuestion,
		}),
		{ totalQuestions: 0, totalMarks: 0 },
	);
}
