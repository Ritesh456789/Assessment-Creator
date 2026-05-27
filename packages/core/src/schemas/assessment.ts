export type AssessmentStatus = 'draft' | 'queued' | 'processing' | 'completed' | 'failed';
export type AssessmentStage = 'builder' | 'confirmation' | 'generating' | 'ready' | 'error';

export type DifficultyLevel = 'easy' | 'moderate' | 'hard';

export interface QuestionTypeOption {
	type: string;
	label: string;
	description?: string;
	defaultDifficulty: DifficultyLevel;
	defaultMarksPerQuestion: number;
	maxQuestions?: number;
}

export interface UploadedAssetPayload {
	fileName: string;
	mimeType: string;
	dataUrl: string;
	sizeBytes: number;
}

export interface QuestionConfig {
	type: string;
	count: number;
	marksPerQuestion: number;
	difficulty: DifficultyLevel;
}

export interface AssessmentDraft {
	title: string;
	subject: string;
	className: string;
	dueDate: string;
	instructions: string;
	sourceFileName?: string;
	sourceAttachment?: UploadedAssetPayload;
	questionTypes: QuestionConfig[];
}

export interface AssessmentSummary extends AssessmentDraft {
	id: string;
	status: AssessmentStatus;
	createdAt: string;
	progress?: number;
	generatedPaperId?: string;
}

export interface AssessmentGenerationRequest {
	draft: AssessmentDraft;
	questionTypeCatalog: QuestionTypeOption[];
	subject: string;
	className: string;
}

export interface AssessmentGenerationProgress {
	assessmentId: string;
	progress: number;
	stage: AssessmentStage;
	message: string;
}

export interface QuestionTypeSeedDocument extends QuestionTypeOption {
	createdAt?: string;
	updatedAt?: string;
}
export {};
