import { Schema, model, type InferSchemaType } from 'mongoose';

const questionConfigSchema = new Schema(
	{
		type: { type: String, required: true },
		count: { type: Number, required: true },
		marksPerQuestion: { type: Number, required: true },
		difficulty: { type: String, required: true },
	},
	{ _id: false },
);

const assessmentSchema = new Schema(
	{
		title: { type: String, required: true },
		subject: { type: String, required: true },
		className: { type: String, required: true },
		dueDate: { type: String, required: true },
		instructions: { type: String, required: true },
		sourceFileName: { type: String },
		sourceAssetId: { type: Schema.Types.ObjectId, ref: 'SourceDocument' },
		questionTypes: { type: [questionConfigSchema], default: [] },
		status: { type: String, enum: ['draft', 'queued', 'processing', 'completed', 'failed'], default: 'draft' },
		stage: { type: String, default: 'builder' },
		progress: { type: Number, default: 0 },
		progressMessage: { type: String, default: 'Draft created' },
		generationRequestedAt: { type: Date },
		generatedPaperId: { type: Schema.Types.ObjectId, ref: 'ExamPaper' },
		questionTypeSnapshot: { type: Schema.Types.Mixed, default: [] },
		lastError: { type: String },
	},
	{ timestamps: true },
);

assessmentSchema.index({ status: 1, createdAt: -1 });

export type AssessmentDocument = InferSchemaType<typeof assessmentSchema>;

export const AssessmentModel = model('Assessment', assessmentSchema);
