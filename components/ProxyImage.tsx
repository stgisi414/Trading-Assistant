import React, { useState, useEffect } from 'react';

// Create a proxy URL for extfernal images to avoid CORS issues
const getProxyUrl = (url: string) => {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
};

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
    const [imageSrc, setImageSrc] = useState(getProxyUrl(src));
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setImageSrc(src);
        setHasError(false);
        setIsLoading(true);
    }, [src]);

    const handleError = () => {
        console.log('Image failed to load:', imageSrc);
        
        if (fallbackSrc && imageSrc !== fallbackSrc) {
            console.log('Trying fallback image:', fallbackSrc);
            setImageSrc(fallbackSrc);
            return;
        }
        
        // Try proxy URL if not already using one
        if (!imageSrc.includes('weserv.nl') && !imageSrc.includes('cors-anywhere')) {
            const proxyUrl = getProxyUrl(src);
            if (proxyUrl !== src) {
                console.log('Trying proxy URL:', proxyUrl);
                setImageSrc(proxyUrl);
                return;
            }
        }
        
        // Generate a placeholder image based on the alt text
        const placeholderUrl = `data:image/svg+xml;base64,${btoa(`
            <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                <rect width="400" height="300" fill="#374151"/>
                <text x="200" y="140" font-family="Arial, sans-serif" font-size="14" fill="#9CA3AF" text-anchor="middle">
                    ${alt.substring(0, 30)}
                </text>
                <text x="200" y="160" font-family="Arial, sans-serif" font-size="12" fill="#6B7280" text-anchor="middle">
                    Image not available
                </text>
            </svg>
        `)}`;
        
        setImageSrc(placeholderUrl);
        setHasError(true);
        setIsLoading(false);
        
        if (onError) onError();
    };

    const handleLoad = () => {
        setIsLoading(false);
        setHasError(false);
        if (onLoad) onLoad();
    };

    if (hasError && imageSrc.startsWith('data:image/svg+xml')) {
        return (
            <div className={`${className} bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center p-4 rounded border border-gray-200 dark:border-gray-600`}>
                <svg className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-500 dark:text-gray-400 text-xs text-center">{alt.substring(0, 20)}</span>
                <span className="text-gray-400 dark:text-gray-500 text-xs">Image unavailable</span>
            </div>
        );
    }

    return (
        <div className="relative">
            {isLoading && (
                <div className={`${className} bg-gray-100 dark:bg-gray-700 flex items-center justify-center animate-pulse`}>
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
            <img
                src={imageSrc}
                alt={alt}
                className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                onError={handleError}
                onLoad={handleLoad}
                referrerPolicy="no-referrer"
                loading="lazy"
                style={{ display: isLoading ? 'none' : 'block' }}
            />
        </div>
    );
};