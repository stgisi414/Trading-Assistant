
import React, { useState } from 'react';
import { ContactModal } from './ContactModal';

interface FooterProps {
    className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);

    return (
        <>
            <footer className={`bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 px-6 ${className}`}>
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        © 2025 <span className="font-semibold text-gray-900 dark:text-white signatex-embossed">Signatex.co</span>. All rights reserved.
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setIsContactModalOpen(true)}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                        >
                            Contact Us
                        </button>
                    </div>
                </div>
            </footer>

            <ContactModal
                isOpen={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
            />
        </>
    );
};
