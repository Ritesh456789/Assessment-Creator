import { Schema, model, type InferSchemaType } from 'mongoose';

const generatedQuestionSchema = new Schema(
	{
		id: { type: String, required: true },
		text: { type: String, required: true },
		marks: { type: Number, required: true },
		difficulty: { type: String, required: true },
		answer: { type: String },
	},
	{ _id: false },
);

const generatedSectionSchema = new Schema(
	{
		title: { type: String, required: true },
		instruction: { type: String, required: true },
		questions: { type: [generatedQuestionSchema], default: [] },
	},
	{ _id: false },
);

const examPaperSchema = new Schema(
	{
		assessmentId: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true, index: true },
		title: { type: String, required: true },
		subject: { type: String, required: true },
		className: { type: String, required: true },
		totalMarks: { type: Number, required: true },
		totalTimeMinutes: { type: Number, required: true },
		sections: { type: [generatedSectionSchema], default: [] },
		answerKey: { type: [generatedQuestionSchema], default: [] },
		notes: { type: [String], default: [] },
	},
	{ timestamps: true },
);

export type ExamPaperDocument = InferSchemaType<typeof examPaperSchema>;

export const ExamPaperModel = model('ExamPaper', examPaperSchema);
