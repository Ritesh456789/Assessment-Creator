'use client';

import { Download, RefreshCw, ShieldCheck } from 'lucide-react';

import type { ExamPaper } from '@core/schemas/exam-paper';

type Props = {
	variant: 'desktop' | 'mobile';
	paper: ExamPaper;
	onRegenerate: () => void;
	onDownload: () => void;
};

const SCHOOL_NAME = 'Delhi Public School, Sector-4, Bokaro';

function difficultyLabel(difficulty: string) {
	return difficulty === 'hard' ? 'Challenging' : `${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)}`;
}

function sectionLabel(index: number) {
	return `Section ${String.fromCharCode(65 + index)}`;
}

function sectionHeading(title: string, index: number) {
	const label = sectionLabel(index);
	return title.trim().toLowerCase() === label.toLowerCase() ? null : title;
}

function classLabel(className: string) {
	return className.replace(/^class\s*:?\s*/i, '').trim() || className;
}

export function ExamPaperView({ variant, paper, onRegenerate, onDownload }: Props) {
	let questionNumber = 0;
	const displayClassName = classLabel(paper.className);
	const completionMessage = `Certainly! Your ${paper.subject} paper for Class ${displayClassName} is ready with ${paper.sections.length} sections and ${paper.totalMarks} total marks.`;
	const nextActionMessage = 'Regenerate if you want a different balance, or download the PDF to share it now.';

	return (
		<div className={`generated-paper-layout generated-paper-layout-${variant}`}>
			<div className="generated-paper-actions">
				<div className="generated-paper-note">
					<div className="generated-paper-note-copy">
						<p className="generated-paper-note-title">{completionMessage}</p>
						<p className="generated-paper-note-body">{nextActionMessage}</p>
					</div>
				</div>
				<div className="generated-paper-button-row">
					<button type="button" className="paper-action-button paper-action-secondary" onClick={onRegenerate} aria-label="Regenerate assessment">
						<RefreshCw size={14} />
						<span className="paper-action-label">Regenerate</span>
					</button>
					<button type="button" className="paper-action-button paper-action-primary" onClick={onDownload} aria-label="Download as PDF">
						<Download size={14} />
						<span className="paper-action-label">Download as PDF</span>
					</button>
				</div>
			</div>

			<div className="paper-preview-shell">
				<div className="paper-preview">
					<header className="paper-preview-header">
						<h1>{SCHOOL_NAME}</h1>
						<h2>Subject: {paper.subject}</h2>
						<h2>Class: {displayClassName}</h2>
					</header>

					<div className="paper-exam-meta">
						<strong>Time Allowed: {paper.totalTimeMinutes} minutes</strong>
						<strong>Maximum Marks: {paper.totalMarks}</strong>
					</div>

					<p className="paper-general-instruction">All questions are compulsory unless stated otherwise.</p>

					<div className="paper-student-fields">
						<p><strong>Name:</strong><span /></p>
						<p><strong>Roll Number:</strong><span /></p>
						<p><strong>Class: {displayClassName} Section:</strong><span className="paper-short-line" /></p>
					</div>

					<div className="paper-section-list">
						{paper.sections.map((section, sectionIndex) => (
							<section className="paper-section" key={`${section.title}-${sectionIndex}`}>
								<div className="paper-section-title">
									<h3>{sectionLabel(sectionIndex)}</h3>
									{sectionHeading(section.title, sectionIndex) ? <h4>{section.title}</h4> : null}
									<p>{section.instruction}</p>
								</div>
								<ol className="paper-question-list" start={questionNumber + 1}>
									{section.questions.map((question) => {
										questionNumber += 1;
										return (
											<li className="paper-question" key={question.id}>
												<span>[{difficultyLabel(question.difficulty)}] {question.text} [{question.marks} Marks]</span>
											</li>
										);
									})}
								</ol>
							</section>
						))}
					</div>

					<p className="paper-end-marker">End of Question Paper</p>

					{paper.answerKey && paper.answerKey.length > 0 ? (
						<section className="paper-answer-key">
							<h3>Answer Key:</h3>
							<ol>
								{paper.answerKey.map((answer) => (
									<li key={answer.id}>{answer.answer || answer.text}</li>
								))}
							</ol>
						</section>
					) : null}
				</div>
			</div>
		</div>
	);
}
export {};
