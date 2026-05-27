import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AssessmentDraft, AssessmentStage, AssessmentSummary, QuestionConfig, QuestionTypeOption, UploadedAssetPayload } from '@core/schemas/assessment';
import type { ExamPaper } from '@core/schemas/exam-paper';

type WorkflowStep = 'empty' | 'builder' | 'confirmation' | 'generating' | 'result';

type AssessmentWorkspaceState = {
	step: WorkflowStep;
	questionTypeCatalog: QuestionTypeOption[];
	draft: AssessmentDraft;
	assessmentCount: number;
	assessmentId: string | null;
	editingAssessmentId: string | null;
	examPaper: ExamPaper | null;
	progress: number;
	progressMessage: string;
	serverStage: AssessmentStage | null;
	setQuestionTypeCatalog: (catalog: QuestionTypeOption[]) => void;
	setAssessmentCount: (count: number) => void;
	openBuilder: () => void;
	returnToBuilder: () => void;
	openEmpty: () => void;
	openConfirmation: () => void;
	openGenerating: () => void;
	openResult: () => void;
	setAssessmentId: (assessmentId: string | null) => void;
	loadAssessmentForEditing: (assessment: AssessmentSummary) => void;
	setExamPaper: (paper: ExamPaper | null) => void;
	setGenerationProgress: (progress: number, message: string, stage?: AssessmentStage | null) => void;
	updateDraftField: <K extends keyof AssessmentDraft>(key: K, value: AssessmentDraft[K]) => void;
	updateQuestionType: (index: number, patch: Partial<QuestionConfig>) => void;
	addQuestionType: (questionType?: QuestionConfig) => void;
	removeQuestionType: (index: number) => void;
	seedQuestionTypesFromCatalog: () => void;
	setSourceAttachment: (asset: UploadedAssetPayload | null) => void;
	resetFlow: () => void;
};

const initialDraft: AssessmentDraft = {
	title: '',
	subject: '',
	className: '',
	dueDate: '',
	instructions: '',
	sourceFileName: undefined,
	questionTypes: [],
};

function createQuestionTypeRow(item: QuestionTypeOption): QuestionConfig {
	return {
		type: item.type,
		count: 4,
		marksPerQuestion: item.defaultMarksPerQuestion,
		difficulty: item.defaultDifficulty,
	};
}

function defaultQuestionRows(catalog: QuestionTypeOption[]): QuestionConfig[] {
	return catalog.slice(0, 4).map(createQuestionTypeRow);
}

export const useAssessmentStore = create<AssessmentWorkspaceState>()(
	persist(
		(set, get) => ({
			step: 'empty',
			questionTypeCatalog: [],
			draft: initialDraft,
			assessmentCount: 0,
			assessmentId: null,
			editingAssessmentId: null,
			examPaper: null,
			progress: 0,
			progressMessage: 'Ready to begin',
			serverStage: null,
			setQuestionTypeCatalog: (catalog) => set({ questionTypeCatalog: catalog }),
			setAssessmentCount: (assessmentCount) => set({ assessmentCount }),
			openBuilder: () => set({ step: 'builder', examPaper: null, progress: 0, progressMessage: 'Ready to begin', editingAssessmentId: null, assessmentId: null }),
			returnToBuilder: () => set({ step: 'builder', examPaper: null, progress: 0, progressMessage: 'Ready to begin' }),
			openEmpty: () => set({ step: 'empty', assessmentId: null, editingAssessmentId: null, examPaper: null, progress: 0, progressMessage: 'Ready to begin' }),
			openConfirmation: () => set({ step: 'confirmation' }),
			openGenerating: () => set({ step: 'generating' }),
			openResult: () => set({ step: 'result' }),
			setAssessmentId: (assessmentId) => set({ assessmentId }),
			loadAssessmentForEditing: (assessment) => set({
				step: 'builder',
				assessmentId: assessment.id,
				editingAssessmentId: assessment.id,
				draft: {
					title: assessment.title,
					subject: assessment.subject,
					className: assessment.className,
					dueDate: assessment.dueDate,
					instructions: assessment.instructions,
					sourceFileName: assessment.sourceFileName,
					questionTypes: assessment.questionTypes,
				},
				examPaper: null,
				progress: 0,
				progressMessage: 'Ready to begin',
			}),
			setExamPaper: (paper) => set({ examPaper: paper }),
			setGenerationProgress: (progress, message, stage = null) => set({ progress, progressMessage: message, serverStage: stage ?? null }),
			updateDraftField: (key, value) => set((state) => ({ draft: { ...state.draft, [key]: value } })),
			updateQuestionType: (index, patch) => set((state) => ({
				draft: {
					...state.draft,
					questionTypes: state.draft.questionTypes.map((item, currentIndex) => (currentIndex === index ? { ...item, ...patch } : item)),
				},
			})),
			addQuestionType: (questionType) => set((state) => ({
				draft: {
					...state.draft,
					questionTypes: [...state.draft.questionTypes, questionType ?? { type: '', count: 1, marksPerQuestion: 1, difficulty: 'moderate' }],
				},
			})),
			removeQuestionType: (index) => set((state) => ({
				draft: {
					...state.draft,
					questionTypes: state.draft.questionTypes.filter((_, currentIndex) => currentIndex !== index),
				},
			})),
			seedQuestionTypesFromCatalog: () => {
				const { questionTypeCatalog, draft } = get();
				if (draft.questionTypes.length === 0 && questionTypeCatalog.length > 0) {
					set((state) => ({
						draft: {
							...state.draft,
							questionTypes: defaultQuestionRows(state.questionTypeCatalog),
						},
					}));
				}
			},
			setSourceAttachment: (asset) => set((state) => ({
				draft: {
					...state.draft,
					sourceFileName: asset?.fileName,
					sourceAttachment: asset ?? undefined,
				},
			})),
			resetFlow: () => set({
				step: 'empty',
				assessmentId: null,
				editingAssessmentId: null,
				examPaper: null,
				progress: 0,
				progressMessage: 'Ready to begin',
				serverStage: null,
			}),
		}),
		{
			name: 'assess-ai-workflow-state',
			partialize: (state) => ({
				step: state.step,
				questionTypeCatalog: state.questionTypeCatalog,
				draft: state.draft,
				assessmentCount: state.assessmentCount,
			}),
		},
	),
);
