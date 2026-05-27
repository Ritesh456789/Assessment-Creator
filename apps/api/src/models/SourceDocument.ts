import { Schema, model, type InferSchemaType } from 'mongoose';

const sourceDocumentSchema = new Schema(
	{
		fileName: { type: String, required: true },
		mimeType: { type: String, required: true },
		sizeBytes: { type: Number, required: true },
		storageType: { type: String, enum: ['buffer', 'base64'], default: 'buffer' },
		data: { type: Buffer, required: true },
		checksum: { type: String, required: true },
		context: { type: String, default: 'assessment-upload' },
	},
	{ timestamps: true },
);

export type SourceDocumentDocument = InferSchemaType<typeof sourceDocumentSchema>;

export const SourceDocumentModel = model('SourceDocument', sourceDocumentSchema);