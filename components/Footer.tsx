
import React, { useState } from 'react';
import { ContactModal } from './ContactModal';

interface FooterProps {
    className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);

    const shareToX = () => {
        const url = window.location.href;
        const text = 'Check out Signatex - AI-Powered Trading Assistant for Market Insights';
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank', 'width=600,height=400');
    };

    const shareToFacebook = () => {
        const url = window.location.href;
        const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank', 'width=600,height=400');
    };

    return (
        <>
            <footer className={`border-t py-4 px-6 ${className}`} style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}>
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                    <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        © 2025 <span className="font-semibold signatex-embossed" style={{ color: 'var(--color-text-primary)' }}>Signatex.co</span>. All rights reserved.
                    </div>
                    <div className="flex items-center space-x-4">
                        {/* Social Media Share Icons */}
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={shareToX}
                                className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                                title="Share on X"
                                style={{ color: 'var(--color-text-secondary)' }}
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                            </button>
                            <button
                                onClick={shareToFacebook}
                                className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                                title="Share on Facebook"
                                style={{ color: 'var(--color-text-secondary)' }}
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                            </button>
                        </div>
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
