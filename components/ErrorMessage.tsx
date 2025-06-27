import React from 'react';

interface ErrorMessageProps {
    message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
    return (
        <div className="bg-red-100 dark:bg-red-900/40 border-l-4 border-red-500 dark:border-red-600 text-red-700 dark:text-red-300 p-4 rounded-md" role="alert">
            <p className="font-bold">Error</p>
            <p>{message}</p>
        </div>
    );
};