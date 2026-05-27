import { Schema, model, type InferSchemaType } from 'mongoose';

const questionCategorySchema = new Schema(
	{
		key: { type: String, required: true, unique: true, index: true },
		label: { type: String, required: true },
		description: { type: String, default: '' },
		defaultDifficulty: { type: String, required: true },
		defaultMarksPerQuestion: { type: Number, required: true },
		maxQuestions: { type: Number },
		active: { type: Boolean, default: true },
	},
	{ timestamps: true },
);

export type QuestionCategoryDocument = InferSchemaType<typeof questionCategorySchema>;

export const QuestionCategoryModel = model('QuestionCategory', questionCategorySchema);