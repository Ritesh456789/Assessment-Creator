'use client';

import { X } from 'lucide-react';
import { useNotificationStore } from '../store/notification-store';

export function ToastContainer() {
	const { toasts, removeToast } = useNotificationStore();

	return (
		<div className="toast-container">
			{toasts.map((toast) => (
				<div key={toast.id} className={`toast toast-${toast.type}`}>
					<div className="toast-content">
						<span className="toast-message">{toast.message}</span>
					</div>
					<button className="toast-close" onClick={() => removeToast(toast.id)} aria-label="Close notification">
						<X size={16} />
					</button>
				</div>
			))}
		</div>
	);
}
