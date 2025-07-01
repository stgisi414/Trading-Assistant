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
    const [imageSrc, setImageSrc] = useState(src);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setImageSrc(src);
        setHasError(false);
    }, [src]);

    const handleError = () => {
        if (fallbackSrc && imageSrc !== fallbackSrc) {
            setImageSrc(fallbackSrc);
        } else {
            setHasError(true);
        }
        if (onError) onError();
    };

    if (hasError) {
        return (
            <div className={`${className} bg-gray-700 flex items-center justify-center`}>
                <span className="text-gray-500 text-xs">No Image</span>
            </div>
        );
    }

    return (
        <img
            src={imageSrc}
            alt={alt}
            className={className}
            onError={handleError}
            onLoad={onLoad}
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            loading="lazy"
        />
    );
};