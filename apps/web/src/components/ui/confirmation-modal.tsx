'use client';

import { X } from 'lucide-react';

interface ConfirmationModalProps {
	isOpen: boolean;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	isDangerous?: boolean;
	onConfirm: () => void | Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
}

export function ConfirmationModal({
	isOpen,
	title,
	message,
	confirmText = 'Confirm',
	cancelText = 'Cancel',
	isDangerous = false,
	onConfirm,
	onCancel,
	isLoading = false,
}: ConfirmationModalProps) {
	if (!isOpen) {
		return null;
	}

	return (
		<div className="modal-overlay" onClick={onCancel}>
			<div className="modal-container" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h2 className="modal-title">{title}</h2>
					<button className="modal-close" onClick={onCancel} aria-label="Close">
						<X size={20} />
					</button>
				</div>
				<div className="modal-body">
					<p className="modal-message">{message}</p>
				</div>
				<div className="modal-footer">
					<button className="modal-button modal-button-secondary" onClick={onCancel} disabled={isLoading}>
						{cancelText}
					</button>
					<button
						className={`modal-button ${isDangerous ? 'modal-button-danger' : 'modal-button-primary'}`}
						onClick={onConfirm}
						disabled={isLoading}
					>
						{confirmText}
					</button>
				</div>
			</div>
		</div>
	);
}
