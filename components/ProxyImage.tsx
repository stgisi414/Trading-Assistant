
import React, { useState, useEffect } from 'react';

interface ProxyImageProps {
    src: string;
    alt: string;
    className?: string;
    onError?: () => void;
    onLoad?: () => void;
    fallbackSrc?: string;
}

export const ProxyImage: React.FC<ProxyImageProps> = ({ 
    src, 
    alt, 
    className = '', 
    onError, 
    onLoad,
    fallbackSrc 
}) => {
    const [currentSrc, setCurrentSrc] = useState(src);
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Reset state when src prop changes
    useEffect(() => {
        setCurrentSrc(src);
        setHasError(false);
        setIsLoading(true);
    }, [src]);

    const handleError = () => {
        console.warn('Image failed to load:', currentSrc);
        setHasError(true);
        setIsLoading(false);
        
        if (fallbackSrc && currentSrc !== fallbackSrc) {
            console.log('Trying fallback:', fallbackSrc);
            setCurrentSrc(fallbackSrc);
            setHasError(false);
            setIsLoading(true);
        } else if (!currentSrc.includes('placeholder')) {
            // Generate placeholder SVG
            const placeholderSvg = `data:image/svg+xml;base64,${btoa(`
                <svg width="200" height="120" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100%" height="100%" fill="#374151"/>
                    <text x="50%" y="50%" font-family="Arial" font-size="14" fill="#9CA3AF" text-anchor="middle" dy=".3em">
                        Image unavailable
                    </text>
                </svg>
            `)}`;
            setCurrentSrc(placeholderSvg);
        }
        
        if (onError) onError();
    };

    const handleLoad = () => {
        setIsLoading(false);
        setHasError(false);
        console.log('Image loaded successfully:', currentSrc);
        if (onLoad) onLoad();
    };

    return (
        <div className="relative">
            <img
                src={currentSrc}
                alt={alt}
                className={`${className} ${isLoading ? 'opacity-50' : ''} ${hasError ? 'opacity-60' : ''}`}
                onError={handleError}
                onLoad={handleLoad}
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                loading="lazy"
            />
            {isLoading && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
            )}
        </div>
    );
};
