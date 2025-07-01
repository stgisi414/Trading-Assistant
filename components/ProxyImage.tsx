import React from 'react';

interface ProxyImageProps {
    src: string;
    alt: string;
    className?: string;
    onError?: () => void;
}

export const ProxyImage: React.FC<ProxyImageProps> = ({ src, alt, className = '', onError }) => {
    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={onError}
            crossOrigin="anonymous"
            loading="lazy"
        />
    );
};