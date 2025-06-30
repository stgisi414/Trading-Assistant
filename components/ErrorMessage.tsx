import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorMessageProps {
    message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
    return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 mr-3" />
                <p className="text-red-700 dark:text-red-300 font-medium">{message}</p>
            </div>
        </div>
    );
};