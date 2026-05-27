import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
	duration?: number;
}

interface NotificationState {
	toasts: Toast[];
	addToast: (message: string, type: ToastType, duration?: number) => void;
	removeToast: (id: string) => void;
	clearToasts: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
	toasts: [],
	addToast: (message: string, type: ToastType, duration = 5000) => {
		const id = `${Date.now()}-${Math.random()}`;
		set((state) => ({
			toasts: [...state.toasts, { id, message, type, duration }],
		}));

		if (duration > 0) {
			setTimeout(() => {
				set((state) => ({
					toasts: state.toasts.filter((t) => t.id !== id),
				}));
			}, duration);
		}
	},
	removeToast: (id: string) => {
		set((state) => ({
			toasts: state.toasts.filter((t) => t.id !== id),
		}));
	},
	clearToasts: () => {
		set({ toasts: [] });
	},
}));
