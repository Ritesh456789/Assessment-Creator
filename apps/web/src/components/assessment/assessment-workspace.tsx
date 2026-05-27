'use client';

import { ArrowLeft, Filter, MoreVertical, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { AssessmentSummary, AssessmentStage } from '@core/schemas/assessment';
import type { WebSocketEventPayloadMap } from '@core/schemas/websocket';

import { useAssessmentStore } from '../../store/assessment-store';
import { useNotificationStore } from '../../store/notification-store';
import { confirmAssessmentGeneration, createAssessmentDraft, deleteAssessment, fetchAssessments, fetchQuestionCategories, getAssessmentPdfUrl, getExamPaper, regenerateAssessment, updateAssessmentDraft, getAssessment } from '../../lib/api';
import { createWorkflowSocket } from '../../lib/websocket';
import { AssessmentBuilder } from './assessment-builder';
import { AssessmentConfirmation } from './assessment-confirmation';
import { ComposerProgress } from './composer-progress';
import { ExamPaperView } from '../output/exam-paper';
import { ConfirmationModal } from '../ui/confirmation-modal';

type Props = {
	variant: 'desktop' | 'mobile';
};

export function AssessmentWorkspace({ variant }: Props) {
	const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
	const [assessmentLoadError, setAssessmentLoadError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
	const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; assessment: AssessmentSummary | null; isLoading: boolean }>({
		isOpen: false,
		assessment: null,
		isLoading: false,
	});
	const {
		step,
		questionTypeCatalog,
		examPaper,
		progress,
		progressMessage,
		assessmentId,
		editingAssessmentId,
		setQuestionTypeCatalog,
		seedQuestionTypesFromCatalog,
		openBuilder,
		returnToBuilder,
		openEmpty,
		openConfirmation,
		openGenerating,
		openResult,
		setAssessmentId,
		setAssessmentCount,
		setExamPaper,
		setGenerationProgress,
		draft,
	} = useAssessmentStore();
	const { addToast } = useNotificationStore();

	const visibleAssessments = useMemo(() => {
		const normalizedSearch = searchTerm.trim().toLowerCase();
		return assessments.filter((assessment) => (
			assessment.status === 'completed'
			&& (normalizedSearch.length === 0 || assessment.title.toLowerCase().includes(normalizedSearch))
		));
	}, [assessments, searchTerm]);

	async function refreshAssessments() {
		try {
			const records = await fetchAssessments();
			setAssessments(records);
			// Keep sidebar badge in sync with completed assessments count
			setAssessmentCount(records.filter((assessment) => assessment.status === 'completed').length);
			setAssessmentLoadError(null);
		} catch {
			setAssessmentLoadError('Unable to load assessments from MongoDB right now.');
		}
	}

	useEffect(() => {
		let mounted = true;
		void fetchQuestionCategories()
			.then((catalog) => {
				if (!mounted) {
					return;
				}
				setQuestionTypeCatalog(catalog);
				seedQuestionTypesFromCatalog();
			})
			.catch(() => {
				console.error('Unable to load question categories from the API.');
			});

		return () => {
			mounted = false;
		};
	}, [seedQuestionTypesFromCatalog, setQuestionTypeCatalog]);

	useEffect(() => {
		void refreshAssessments();
	}, []);

	useEffect(() => {
		if (step === 'empty') {
			void refreshAssessments();
		}
	}, [step]);

	useEffect(() => {
		if (!assessmentId) {
			return;
		}

		const socket = createWorkflowSocket((event) => {
			if (event.data.assessmentId !== assessmentId) {
				return;
			}

			if (event.type === 'assessment:processing') {
				const payload = event.data as WebSocketEventPayloadMap['assessment:processing'];
				// Use server-provided progressMessage when available; otherwise derive a concise message.
				const friendlyMessage = (payload as any).progressMessage ?? (payload.progress >= 80 ? 'Formatting assessment' : 'Generating content');
				setGenerationProgress(payload.progress, friendlyMessage, 'generating');
			}

			if (event.type === 'assessment:completed') {
				setGenerationProgress(100, 'Assessment ready', 'ready');
				void refreshAssessments();
				// Fetch the exam paper from the API and open the result view
				(async () => {
					try {
						const resp = await getExamPaper(assessmentId);
						setExamPaper(resp.paper);
						openResult();
					} catch (err) {
						console.error('Unable to fetch exam paper after completion event', err);
						openResult();
					}
				})();
			}
		});

		return () => socket.close();
	}, [assessmentId, openResult, setGenerationProgress]);

	useEffect(() => {
		// Listen for global assessment updates (dispatched by top-level socket) and refresh list
		const handler = (event: Event) => {
			void refreshAssessments();
		};

		window.addEventListener('assessment:updated', handler as EventListener);
		return () => window.removeEventListener('assessment:updated', handler as EventListener);
	}, []);

	async function handleGenerate() {
		if (!draft.title.trim() || !draft.subject.trim() || !draft.className.trim() || !draft.dueDate.trim() || !draft.instructions.trim() || draft.questionTypes.length === 0) {
			addToast('Fill in the assessment details and add at least one question type before creating the assessment.', 'warning');
			return;
		}

		openGenerating();
		setGenerationProgress(18, 'Preparing your prompt', 'confirmation');
		try {
			const saved = editingAssessmentId
				? await updateAssessmentDraft(editingAssessmentId, { draft, subject: draft.subject, className: draft.className })
				: await createAssessmentDraft({ draft, subject: draft.subject, className: draft.className });
			setAssessmentId(saved.assessment.id);
			void refreshAssessments();
			setGenerationProgress(35, 'Cooking the assessment', 'generating');
			const response = await confirmAssessmentGeneration(saved.assessment.id);
			// If the API returned a generated paper (synchronous processing), show it immediately.
			if (response.generatedPaper) {
				setExamPaper(response.generatedPaper);
				void refreshAssessments();
				setGenerationProgress(100, 'Assessment ready', 'ready');
				openResult();
			} else {
				// Queued for background processing — keep showing the generating view and wait for websocket events.
				addToast('Assessment queued for background generation. Waiting for worker to finish...', 'info');
				// Start a polling fallback to update progress in case websocket messages are missed.
				let stopped = false;
				const poll = async () => {
					if (stopped) return;
					try {
						const latest = await getAssessment(saved.assessment.id);
						const assign = latest.assessment;
						if (assign.progress != null) {
							setGenerationProgress(assign.progress, (assign.progressMessage as string) ?? 'Processing', (assign.stage as AssessmentStage) ?? 'generating');
						}
						if (assign.status === 'completed') {
							stopped = true;
							if (assign.generatedPaperId) {
								try {
									const resp = await getExamPaper(saved.assessment.id);
									setExamPaper(resp.paper);
								} catch {}
							}
							setGenerationProgress(100, 'Assessment ready', 'ready');
							openResult();
							return;
						}
						if (assign.status === 'failed') {
							stopped = true;
							addToast('Assessment generation failed. See assessment list for details.', 'error');
							openBuilder();
							return;
						}
					} catch (err) {
						// ignore transient errors and retry
					}
					setTimeout(poll, 2000);
				};
				void poll();
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unable to create assessment';
			addToast(message, 'error');
			setAssessmentId(null);
			openBuilder();
		}
	}

	async function handleRegenerate() {
		if (!assessmentId) {
			return;
		}
		openGenerating();
		setGenerationProgress(20, 'Reheating the prompt', 'generating');
		try {
			const response = await regenerateAssessment(assessmentId);
			setExamPaper(response.paper);
			void refreshAssessments();
			setGenerationProgress(100, 'Assessment ready', 'ready');
			openResult();
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unable to regenerate assessment';
			addToast(message, 'error');
			openResult();
		}
	}

	async function handleDelete(assessment: AssessmentSummary) {
		setActiveMenuId(null);
		setDeleteConfirmation({ isOpen: true, assessment, isLoading: false });
	}

	async function confirmDelete() {
		if (!deleteConfirmation.assessment) return;
		
		setDeleteConfirmation((prev) => ({ ...prev, isLoading: true }));
		try {
			await deleteAssessment(deleteConfirmation.assessment.id);
			if (deleteConfirmation.assessment.id === assessmentId) {
				openEmpty();
			}
			await refreshAssessments();
			addToast(`"${deleteConfirmation.assessment.title}" deleted successfully`, 'success');
			setDeleteConfirmation({ isOpen: false, assessment: null, isLoading: false });
		} catch (error) {
			addToast(error instanceof Error ? error.message : 'Unable to delete assessment', 'error');
			setDeleteConfirmation((prev) => ({ ...prev, isLoading: false }));
		}
	}

	async function handleViewAssessment(assessment: AssessmentSummary) {
		setActiveMenuId(null);
		try {
			const response = await getExamPaper(assessment.id);
			setAssessmentId(assessment.id);
			setExamPaper(response.paper);
			openResult();
		} catch {
			addToast('The formatted assessment is not ready to view yet.', 'info');
		}
	}

	function formatDate(value: string) {
		const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
		if (dateOnlyMatch) {
			return `${dateOnlyMatch[3]}-${dateOnlyMatch[2]}-${dateOnlyMatch[1]}`;
		}

		const date = new Date(value);
		if (Number.isNaN(date.getTime())) {
			return value;
		}

		return new Intl.DateTimeFormat('en-GB', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		}).format(date).replaceAll('/', '-');
	}

	return (
		<>
			{step === 'empty' ? (
				assessments.length > 0 ? (
					<div className={`assessments-dashboard-shell assessments-dashboard-shell-${variant}`} onClick={() => setActiveMenuId(null)}>
						{variant === 'mobile' ? (
							<div className="assessments-mobile-heading">
								<button type="button" onClick={openEmpty} aria-label="Back to assessments">
									<ArrowLeft size={18} />
								</button>
								<h1>Assessments</h1>
							</div>
						) : null}
						<div className="assessments-dashboard-topline">
							<div className="assessments-dashboard-title">
								<div className="status-dot" />
								<div>
									<h2>Assessments</h2>
									<p>Manage and create assessments for your classes.</p>
								</div>
							</div>
						</div>

						<div className="assessments-toolbar">
							<button type="button" className="assessments-filter-button">
								<Filter size={14} />
								<span>Filter By</span>
							</button>
							<label className="assessments-search">
								<Search size={16} />
								<input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search Assessment" aria-label="Search assessment" />
							</label>
						</div>

						{assessmentLoadError ? <p className="assessments-error">{assessmentLoadError}</p> : null}

						<div className={`assessments-card-grid assessments-card-grid-${variant}`}>
							{visibleAssessments.map((assessment) => (
								<article className="assessment-card-shell" key={assessment.id}>
									<div className="assessment-card-head">
										<h3>{assessment.title}</h3>
										<button
											type="button"
											className="assessment-card-menu"
											aria-label={`Options for ${assessment.title}`}
											aria-expanded={activeMenuId === assessment.id}
											onClick={(event) => {
												event.stopPropagation();
												setActiveMenuId((current) => (current === assessment.id ? null : assessment.id));
											}}
										>
											<MoreVertical size={16} />
										</button>
										{activeMenuId === assessment.id ? (
											<div className="assessment-card-actions" onClick={(event) => event.stopPropagation()}>
												<button type="button" onClick={() => void handleViewAssessment(assessment)}>View Assessment</button>
												<button type="button" className="assessment-action-delete" onClick={() => void handleDelete(assessment)}>Delete</button>
											</div>
										) : null}
									</div>
									<div className="assessment-card-meta-row">
										<span><strong>Assigned on :</strong> {formatDate(assessment.createdAt)}</span>
										<span><strong>Due :</strong> {formatDate(assessment.dueDate)}</span>
									</div>
								</article>
							))}
						</div>

						{visibleAssessments.length === 0 ? <p className="assessments-empty-list">No completed assessments found.</p> : null}

						{variant === 'desktop' ? (
							<button type="button" className="assessments-create-floating" onClick={openBuilder}>
								<Plus size={16} />
								<span>Create Assessment</span>
							</button>
						) : null}
					</div>
				) : (
					<div className={`workspace-empty workspace-empty-${variant}`}>
						<div className="workspace-empty-illustration-wrap">
							<img className="workspace-empty-illustration" src="/no-assessments.png" alt="No assessments yet" />
						</div>
						<h2>No assessments yet</h2>
						<p>Create your first assessment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.</p>
						<button type="button" className="workspace-empty-button" onClick={openBuilder}>
							<Plus size={16} />
							<span>Create Your First Assessment</span>
						</button>
					</div>
				)
			) : null}

			{step === 'builder' ? <AssessmentBuilder variant={variant} onPrevious={openEmpty} onOpenConfirmation={openConfirmation} /> : null}
			{step === 'confirmation' ? <AssessmentConfirmation onBack={returnToBuilder} onGenerate={handleGenerate} /> : null}
			{step === 'generating' ? <ComposerProgress variant={variant} progress={progress} message={progressMessage} /> : null}
			{step === 'result' && examPaper ? (
				<ExamPaperView variant={variant} paper={examPaper} onRegenerate={handleRegenerate} onDownload={() => window.open(getAssessmentPdfUrl(assessmentId ?? ''), '_blank', 'noopener,noreferrer')} />
			) : null}

		<ConfirmationModal
			isOpen={deleteConfirmation.isOpen}
			title="Delete Assessment"
			message={deleteConfirmation.assessment ? `Are you sure you want to delete "${deleteConfirmation.assessment.title}"? This action cannot be undone.` : ''}
			confirmText="Delete"
			cancelText="Cancel"
			isDangerous
			onConfirm={confirmDelete}
			onCancel={() => setDeleteConfirmation({ isOpen: false, assessment: null, isLoading: false })}
			isLoading={deleteConfirmation.isLoading}
		/>
		</>
	);
}
