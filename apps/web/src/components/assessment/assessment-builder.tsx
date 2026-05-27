'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarPlus2, CloudUpload, Mic, Plus } from 'lucide-react';
import { useMemo } from 'react';

import type { UploadedAssetPayload } from '@core/schemas/assessment';
import { calculateTotals } from '@core/workflow/assessment-generation';
import { sanitizeFilename } from '@core/utils/sanitize';

import { useAssessmentStore } from '../../store/assessment-store';
import { useNotificationStore } from '../../store/notification-store';
import { useSanitization } from '../../lib/useSanitization';
import { AssessmentItemRow } from './assessment-item-row';

type Props = {
	variant: 'desktop' | 'mobile';
	onPrevious: () => void;
	onOpenConfirmation: () => void;
};

function toAssetPayload(file: File, dataUrl: string): UploadedAssetPayload {
	return {
		fileName: sanitizeFilename(file.name),
		mimeType: file.type || 'application/octet-stream',
		dataUrl,
		sizeBytes: file.size,
	};
}

async function readFileAsDataUrl(file: File) {
	return await new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(new Error('Unable to read file'));
		reader.readAsDataURL(file);
	});
}

export function AssessmentBuilder({ variant, onPrevious, onOpenConfirmation }: Props) {
	const { draft, questionTypeCatalog, updateDraftField, updateQuestionType, addQuestionType, removeQuestionType, setSourceAttachment } = useAssessmentStore();
	const { addToast } = useNotificationStore();
	const { sanitizeAndValidateFile } = useSanitization();
	const totals = useMemo(() => calculateTotals(draft), [draft]);
	const [validationErrors, setValidationErrors] = useState<{
		title?: string;
		subject?: string;
		className?: string;
		dueDate?: string;
		questionTypes?: string;
		questionRows: Array<{ type?: string; count?: string; marksPerQuestion?: string }>;
	}>({
		questionRows: [],
	});

	function clearValidationField(field: 'title' | 'subject' | 'className' | 'dueDate' | 'questionTypes') {
		setValidationErrors((current) => ({ ...current, [field]: undefined }));
	}

	function validateBeforeNext() {
		const nextErrors: typeof validationErrors = { questionRows: [] };

		if (!draft.title.trim()) nextErrors.title = 'Assessment title is required.';
		if (!draft.subject.trim()) nextErrors.subject = 'Subject is required.';
		if (!draft.className.trim()) nextErrors.className = 'Class is required.';
		if (!draft.dueDate.trim()) nextErrors.dueDate = 'Due date is required.';

		if (draft.questionTypes.length === 0) {
			nextErrors.questionTypes = 'Add at least one question type.';
		}

		nextErrors.questionRows = draft.questionTypes.map((row) => {
			const rowErrors: { type?: string; count?: string; marksPerQuestion?: string } = {};
			if (!row.type.trim()) rowErrors.type = 'Select a question type.';
			if (!Number.isFinite(row.count) || row.count < 1) rowErrors.count = 'Questions must be at least 1.';
			if (!Number.isFinite(row.marksPerQuestion) || row.marksPerQuestion < 1) rowErrors.marksPerQuestion = 'Marks must be at least 1.';
			return rowErrors;
		});

		setValidationErrors(nextErrors);

		const hasRowErrors = nextErrors.questionRows.some((row) => Boolean(row.type || row.count || row.marksPerQuestion));
		const hasErrors = Boolean(nextErrors.title || nextErrors.subject || nextErrors.className || nextErrors.dueDate || nextErrors.questionTypes || hasRowErrors);
		return !hasErrors;
	}

	async function handleFileChange(file: File | null) {
		if (!file) {
			setSourceAttachment(null);
			return;
		}

		// Validate file
		const validation = sanitizeAndValidateFile(file);
		if (!validation.valid) {
			addToast(validation.error || 'Invalid file', 'error');
			return;
		}

		const dataUrl = await readFileAsDataUrl(file);
		setSourceAttachment(toAssetPayload(file, dataUrl));
		addToast(`File "${validation.filename}" uploaded successfully`, 'success');
	}

	return (
		<div className={`assessment-builder assessment-builder-${variant}`}>
			{variant === 'mobile' ? (
				<div className="builder-mobile-header">
					<button type="button" className="builder-mobile-back-button" onClick={onPrevious} aria-label="Back to assessments">
						<ArrowLeft size={18} strokeWidth={2} />
					</button>
					<h1>Create Assessment</h1>
				</div>
			) : (
				<div className="builder-header">
					<span className="status-dot" />
					<div>
						<h1>Create Assessment</h1>
						<p>Set up a new assessment for your students.</p>
					</div>
				</div>
			)}

			<div className="builder-progress-line" aria-hidden="true">
				<span />
			</div>

			<section className="builder-card">
				<div className="builder-card-header">
					<h2>Assessment Details</h2>
					<p>Basic information about your assessment</p>
				</div>

				<div className="builder-meta-grid">
					<label className="builder-field">
						<span>Assessment Title</span>
						<input
							className={validationErrors.title ? 'builder-field-input-error' : ''}
							value={draft.title}
							onChange={(event) => {
								updateDraftField('title', event.target.value);
								clearValidationField('title');
							}}
							placeholder="Enter assessment title"
						/>
						{validationErrors.title ? <small className="builder-field-error">{validationErrors.title}</small> : null}
					</label>
					<label className="builder-field">
						<span>Subject</span>
						<input
							className={validationErrors.subject ? 'builder-field-input-error' : ''}
							value={draft.subject}
							onChange={(event) => {
								updateDraftField('subject', event.target.value);
								clearValidationField('subject');
							}}
							placeholder="Enter subject"
						/>
						{validationErrors.subject ? <small className="builder-field-error">{validationErrors.subject}</small> : null}
					</label>
					<label className="builder-field">
						<span>Class</span>
						<input
							className={validationErrors.className ? 'builder-field-input-error' : ''}
							value={draft.className}
							onChange={(event) => {
								updateDraftField('className', event.target.value);
								clearValidationField('className');
							}}
							placeholder="Enter class"
						/>
						{validationErrors.className ? <small className="builder-field-error">{validationErrors.className}</small> : null}
					</label>
				</div>

				<div className="upload-card">
					<label className="upload-dropzone">
						<input
							type="file"
							accept="image/*,.pdf,.doc,.docx"
							onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
						/>
						<CloudUpload className="upload-icon" size={32} />
						<strong>Choose a file or drag & drop it here</strong>
						<span>JPEG, PNG, upto 10MB</span>
						<span className="upload-browse">Browse Files</span>
					</label>
					<p className="upload-note">Upload images of your preferred document/image</p>
				
				{draft.sourceAttachment ? (
					<div className="upload-preview">
						<div className="preview-thumbnail">
							<img src={draft.sourceAttachment.dataUrl} alt="Uploaded reference" className="preview-image" />
						</div>
						<div className="preview-details">
							<p className="preview-filename">✓ {draft.sourceAttachment.fileName}</p>
							<p className="preview-size">({(draft.sourceAttachment.sizeBytes / 1024).toFixed(1)} KB)</p>
							<button
								type="button"
								className="preview-remove"
								onClick={() => setSourceAttachment(null)}
								aria-label="Remove uploaded file"
							>
								Remove
							</button>
						</div>
					</div>
				) : null}
			</div>

			<label className="builder-field due-date-field">
				<span>Due Date</span>
				<div className="date-input-wrap">
					<input
						className={validationErrors.dueDate ? 'builder-field-input-error' : ''}
						type="date"
						value={draft.dueDate}
						onChange={(event) => {
							updateDraftField('dueDate', event.target.value);
							clearValidationField('dueDate');
						}}
					/>
					<CalendarPlus2 size={22} />
				</div>
				{validationErrors.dueDate ? <small className="builder-field-error">{validationErrors.dueDate}</small> : null}
			</label>

			<div className="question-table-header" aria-hidden="true">
				<span>Question Type</span>
				<span>No. of Questions</span>
				<span>Marks</span>
			</div>
			{validationErrors.questionTypes ? <p className="question-section-error">{validationErrors.questionTypes}</p> : null}

			<div className="question-list">
				{draft.questionTypes.map((row, index) => (
					<AssessmentItemRow
						key={`${row.type}-${index}`}
						index={index}
						row={row}
						questionTypes={questionTypeCatalog}
						validationError={validationErrors.questionRows[index]?.type || validationErrors.questionRows[index]?.count || validationErrors.questionRows[index]?.marksPerQuestion}
						onTypeChange={(value) => {
							const selected = questionTypeCatalog.find((item) => item.type === value);
							updateQuestionType(index, {
								type: value,
								marksPerQuestion: selected?.defaultMarksPerQuestion ?? row.marksPerQuestion,
								difficulty: selected?.defaultDifficulty ?? row.difficulty,
							});
							setValidationErrors((current) => ({
								...current,
								questionRows: current.questionRows.map((item, currentIndex) => (currentIndex === index ? { ...item, type: undefined } : item)),
							}));
						}}
						onCountChange={(value) => {
							updateQuestionType(index, { count: value });
							setValidationErrors((current) => ({
								...current,
								questionRows: current.questionRows.map((item, currentIndex) => (currentIndex === index ? { ...item, count: undefined } : item)),
							}));
						}}
						onMarksChange={(value) => {
							updateQuestionType(index, { marksPerQuestion: value });
							setValidationErrors((current) => ({
								...current,
								questionRows: current.questionRows.map((item, currentIndex) => (currentIndex === index ? { ...item, marksPerQuestion: undefined } : item)),
							}));
						}}
						onRemove={() => removeQuestionType(index)}
					/>
				))}
			</div>

			<button className="add-question-button" type="button" onClick={() => addQuestionType(questionTypeCatalog[0] ? {
				type: questionTypeCatalog[0].type,
				count: 1,
				marksPerQuestion: questionTypeCatalog[0].defaultMarksPerQuestion,
				difficulty: questionTypeCatalog[0].defaultDifficulty,
			} : undefined)}>
				<span className="add-question-icon"><Plus size={20} /></span>
				<span>Add Question Type</span>
			</button>

			<div className="totals-panel">
				<p><span>Total Questions :</span><strong>{totals.totalQuestions}</strong></p>
				<p><span>Total Marks :</span><strong>{totals.totalMarks}</strong></p>
			</div>

			<label className="builder-field additional-info-field">
				<span>Additional Information (For better output)</span>
				<div className="textarea-wrap">
					<textarea value={draft.instructions} onChange={(event) => updateDraftField('instructions', event.target.value)} placeholder="e.g Generate a question paper for 3 hour exam duration..." />
					<button type="button" className="voice-button" aria-label="Voice input display only">
						<Mic size={14} />
					</button>
				</div>
			</label>
		</section>

			<div className="builder-actions">
				<button type="button" className="builder-secondary-button" onClick={onPrevious}>
					<ArrowLeft size={16} />
					<span>Previous</span>
				</button>
				<button
					type="button"
					className="builder-primary-button"
					onClick={() => {
						if (!validateBeforeNext()) {
							return;
						}
						onOpenConfirmation();
					}}
				>
					<span>Next</span>
					<ArrowRight size={16} />
				</button>
			</div>
		</div>
	);
}
