
import React, { useState } from 'react';
import { ContactModal } from './ContactModal';

interface FooterProps {
    className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);

    return (
        <>
            <footer className={`border-t py-4 px-6 ${className}`} style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}>
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                    <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        © 2025 <span className="font-semibold signatex-embossed" style={{ color: 'var(--color-text-primary)' }}>Signatex.co</span>. All rights reserved.
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setIsContactModalOpen(true)}
                            className="text-sm transition-colors"
                            style={{ color: 'var(--color-primary)' }}
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
