'use client';

import { CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

import { calculateTotals } from '@core/workflow/assessment-generation';

import { useAssessmentStore } from '../../store/assessment-store';

type Props = {
	onBack: () => void;
	onGenerate: () => void;
};

export function AssessmentConfirmation({ onBack, onGenerate }: Props) {
	const { draft } = useAssessmentStore();
	const totals = calculateTotals(draft);

	return (
		<div className="confirmation-panel">
			<div className="confirmation-card">
				<div className="confirmation-badge">
					<CheckCircle2 size={16} />
					<span>Ready to create</span>
				</div>
				<h2>Confirm assessment creation</h2>
				<p>We will structure the paper, generate sections, calculate marks, and prepare the PDF download.</p>
				<div className="confirmation-grid">
					<div>
						<small>Title</small>
						<strong>{draft.title}</strong>
					</div>
					<div>
						<small>Subject</small>
						<strong>{draft.subject}</strong>
					</div>
					<div>
						<small>Class</small>
						<strong>{draft.className}</strong>
					</div>
					<div>
						<small>Total Questions</small>
						<strong>{totals.totalQuestions}</strong>
					</div>
					<div>
						<small>Total Marks</small>
						<strong>{totals.totalMarks}</strong>
					</div>
				</div>
				<div className="confirmation-footnote">
					<ShieldCheck size={14} />
					<span>AI will use Gemini 3.5 Flash with structured prompt parsing.</span>
				</div>
			</div>

			<div className="builder-actions confirmation-actions">
				<button type="button" className="builder-secondary-button" onClick={onBack}>
					<span>Back</span>
				</button>
				<button type="button" className="builder-primary-button" onClick={onGenerate}>
					<Sparkles size={15} />
					<span>Confirm & Create</span>
				</button>
			</div>
		</div>
	);
}
