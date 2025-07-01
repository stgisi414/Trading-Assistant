import React, { useState, useEffect } from 'react';

const getProxyUrl = (url: string) => {
    if (!url || url.startsWith('data:') || url.startsWith('blob:')) {
        return url;
    }
    const cleanedUrl = url.replace(/^https?:\/\//, '');
    return `https://images.weserv.nl/?url=${encodeURIComponent(cleanedUrl)}&w=400&h=300&fit=cover&we`;
};

interface ProxyImageProps {
    src: string;
    alt: string;
    className?: string;
    onError?: () => void;
}

export const ProxyImage: React.FC<ProxyImageProps> = ({ src, alt, className = '', onError }) => {
    const [imageSrc, setImageSrc] = useState(getProxyUrl(src));

    useEffect(() => {
        setImageSrc(getProxyUrl(src));
    }, [src]);

    return (
        <img
            src={imageSrc}
            alt={alt}
            className={className}
            onError={onError}
            referrerPolicy="no-referrer"
            loading="lazy"
        />
    );
};