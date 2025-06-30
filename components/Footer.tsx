
import React from 'react';

interface FooterProps {
    className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
    return (
        <footer className={`bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 px-6 text-center ${className}`}>
            <div className="text-sm text-gray-600 dark:text-gray-400">
                © 2025 <span className="font-semibold text-gray-900 dark:text-white signatex-embossed">Signatex</span>. All rights reserved.
            </div>
        </footer>
    );
};
