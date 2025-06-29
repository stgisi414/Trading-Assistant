
import React, { useState, useEffect } from 'react';
import type { ProFlowToast } from '../services/proFlowService.ts';

interface ProFlowToastProps {
    toasts: ProFlowToast[];
    onRemoveToast: (id: string) => void;
}

export const ProFlowToastContainer: React.FC<ProFlowToastProps> = ({ toasts, onRemoveToast }) => {
    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
            {toasts.map((toast, index) => (
                <ToastItem
                    key={`${toast.id}-${index}`}
                    toast={toast}
                    onRemove={() => onRemoveToast(toast.id)}
                />
            ))}
        </div>
    );
};

interface ToastItemProps {
    toast: ProFlowToast;
    onRemove: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);

    useEffect(() => {
        // Show animation
        const showTimer = setTimeout(() => setIsVisible(true), 50);
        
        // Auto-remove timer
        const duration = toast.duration || 3000;
        const removeTimer = setTimeout(() => {
            handleRemove();
        }, duration);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(removeTimer);
        };
    }, []);

    const handleRemove = () => {
        setIsRemoving(true);
        setTimeout(() => {
            onRemove();
        }, 300);
    };

    const getToastStyles = () => {
        const baseStyles = "p-4 rounded-lg shadow-lg border backdrop-blur-sm transition-all duration-300 cursor-pointer";
        
        switch (toast.type) {
            case 'success':
                return `${baseStyles} bg-green-100/90 dark:bg-green-900/80 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200`;
            case 'error':
                return `${baseStyles} bg-red-100/90 dark:bg-red-900/80 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200`;
            case 'warning':
                return `${baseStyles} bg-yellow-100/90 dark:bg-yellow-900/80 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200`;
            default:
                return `${baseStyles} bg-blue-100/90 dark:bg-blue-900/80 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200`;
        }
    };

    const getIconForType = () => {
        switch (toast.type) {
            case 'success':
                return '✅';
            case 'error':
                return '❌';
            case 'warning':
                return '⚠️';
            default:
                return 'ℹ️';
        }
    };

    return (
        <div
            className={`${getToastStyles()} ${
                isVisible && !isRemoving 
                    ? 'translate-x-0 opacity-100 scale-100' 
                    : 'translate-x-full opacity-0 scale-95'
            }`}
            onClick={handleRemove}
        >
            <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0 mt-0.5">
                    {getIconForType()}
                </span>
                <div className="flex-1">
                    <p className="text-sm font-medium leading-relaxed">
                        {toast.message}
                    </p>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleRemove();
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-lg leading-none flex-shrink-0"
                    aria-label="Close notification"
                >
                    ×
                </button>
            </div>
        </div>
    );
};
