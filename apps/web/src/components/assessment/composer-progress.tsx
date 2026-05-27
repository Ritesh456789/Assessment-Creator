'use client';

import { Loader2, Sparkles, TimerReset } from 'lucide-react';

type Props = {
	progress: number;
	message: string;
	variant: 'desktop' | 'mobile';
};

const steps = [
	{ label: 'Draft saved', threshold: 10, detail: 'I have the assessment details and am locking the structure.' },
	{ label: 'Preparing prompt', threshold: 30, detail: 'I’m organizing your instructions and question types into a clean prompt.' },
	{ label: 'Cooking with Gemini', threshold: 55, detail: 'I’m generating the paper content and balancing question difficulty.' },
	{ label: 'Formatting output', threshold: 80, detail: 'I’m polishing the final paper structure and answer key.' },
	{ label: 'Ready', threshold: 100, detail: 'Your assessment is ready to review, edit, or share.' },
];

export function ComposerProgress({ progress, message, variant }: Props) {
	const currentStep = [...steps].reverse().find((step) => progress >= step.threshold) ?? steps[0];
	const nextStep = steps.find((step) => progress < step.threshold) ?? steps[steps.length - 1];
	const progressLabel = `${Math.min(100, progress)}% complete`;
	const progressStateText = progress >= 100 ? 'Finishing touches applied' : `Working on ${currentStep.label.toLowerCase()}`;

	return (
		<div className={`generation-progress generation-progress-${variant}`}>
			<div className="generation-card">
				<div className="generation-hero">
					<div className="generation-orb" aria-hidden="true">
						<Loader2 className="generation-spinner" size={20} />
					</div>
					<div className="generation-hero-copy">
						<span className="generation-kicker">Building your assessment</span>
						<h2>{message}</h2>
						<p>{currentStep.detail}</p>
					</div>
				</div>

				<div className="generation-status-panel">
					<div className="generation-status-card generation-status-card-current">
						<span className="generation-status-label">Working now</span>
						<strong>{currentStep.label}</strong>
						<p>{currentStep.detail}</p>
					</div>
					<div className="generation-status-card generation-status-card-next">
						<span className="generation-status-label">Next up</span>
						<strong>{nextStep.label}</strong>
						<p>{nextStep.detail}</p>
					</div>
				</div>

				<div className="generation-progress-shell">
					<div className="generation-progress-bar" aria-hidden="true">
						<span style={{ width: `${Math.min(100, progress)}%` }} />
					</div>

					<div className="generation-meta generation-meta-strong">
						<TimerReset size={14} />
						<div>
							<span>{progressLabel}</span>
							<small>{progressStateText}</small>
						</div>
					</div>
				</div>

				<div className="generation-status-list">
					{steps.map((step) => (
						<div className={`generation-status-item ${progress >= step.threshold ? 'is-complete' : ''} ${currentStep.label === step.label ? 'is-current' : ''}`} key={step.label}>
							<Sparkles size={14} />
							<span>{step.label}</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
