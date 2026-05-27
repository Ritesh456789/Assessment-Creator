'use client';

import { ChevronDown, Minus, Plus, X } from 'lucide-react';

import type { QuestionConfig, QuestionTypeOption } from '@core/schemas/assessment';

type Props = {
	row: QuestionConfig;
	index: number;
	questionTypes: QuestionTypeOption[];
	validationError?: string;
	onTypeChange: (value: string) => void;
	onCountChange: (value: number) => void;
	onMarksChange: (value: number) => void;
	onRemove: () => void;
};

export function AssessmentItemRow({
	row,
	index,
	questionTypes,
	validationError,
	onTypeChange,
	onCountChange,
	onMarksChange,
	onRemove,
}: Props) {
	return (
		<div className={`question-row ${validationError ? 'question-row-error' : ''}`}>
			<div className="question-row-select-wrap">
				<select className={`question-row-select ${validationError ? 'question-row-select-error' : ''}`} value={row.type} onChange={(event) => onTypeChange(event.target.value)}>
					<option value="">Select question type</option>
					{questionTypes.map((option) => (
						<option value={option.type} key={option.type}>
							{option.label}
						</option>
					))}
				</select>
				<ChevronDown className="question-row-select-icon" size={16} />
			</div>

			<button className="question-row-remove" type="button" aria-label={`Remove question type ${index + 1}`} onClick={onRemove}>
				<X size={13} strokeWidth={2} />
			</button>

			<div className="question-row-controls">
				<div className="question-row-stepper question-row-count">
					<span className="question-row-label">No. of Questions</span>
					<div className="counter-pill">
						<button type="button" onClick={() => onCountChange(Math.max(1, row.count - 1))} aria-label="Decrease question count">
							<Minus size={12} strokeWidth={2.2}/>
						</button>
						<span>{row.count}</span>
						<button type="button" onClick={() => onCountChange(row.count + 1)} aria-label="Increase question count">
							<Plus size={12} strokeWidth={2.2}/>
						</button>
						</div>
					</div>

					<div className="question-row-stepper question-row-marks">
						<span className="question-row-label">Marks</span>
						<div className="counter-pill">
							<button type="button" onClick={() => onMarksChange(Math.max(1, row.marksPerQuestion - 1))} aria-label="Decrease marks">
								<Minus size={12} />
							</button>
							<span>{row.marksPerQuestion}</span>
							<button type="button" onClick={() => onMarksChange(row.marksPerQuestion + 1)} aria-label="Increase marks">
								<Plus size={12} />
							</button>
						</div>
					</div>
			</div>

			{validationError ? <p className="question-row-error-message">{validationError}</p> : null}

		</div>
	);
}
