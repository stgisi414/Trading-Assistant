import React from 'react';

interface ErrorMessageProps {
    message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
    return (
        <div className="glass-effect border-l-4 border-red-500 dark:border-red-400 text-red-700 dark:text-red-300 p-6 rounded-xl shadow-xl card-glow sharp-corners relative overflow-hidden" role="alert">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent"></div>
            <div className="relative z-10">
                <p className="font-bold text-lg flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    Error
                </p>
                <p className="mt-2">{message}</p>
            </div>
        </div>
    );
};