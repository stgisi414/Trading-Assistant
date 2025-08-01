import React, { useState } from 'react';
import { ProxyImage } from './ProxyImage.tsx';
import type { ImageResult } from '../services/imageSearchService.ts';

interface ImageGalleryProps {
    images: ImageResult[];
    title: string;
    className?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, title, className = '' }) => {
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

    if (!images || images.length === 0) {
        return null;
    }

    const handleImageError = (imageUrl: string) => {
        setImageErrors(prev => new Set(prev).add(imageUrl));
    };

    const validImages = images.filter(img => !imageErrors.has(img.url));

    // Dynamic icon selection based on title
    const getIconForTitle = (title: string): string => {
        const lowerTitle = title.toLowerCase();
        
        if (lowerTitle.includes('logo') || lowerTitle.includes('company')) {
            return 'business_center';
        } else if (lowerTitle.includes('analysis') || lowerTitle.includes('illustration') || lowerTitle.includes('reasoning')) {
            return 'image_search';
        } else if (lowerTitle.includes('chart') || lowerTitle.includes('graph')) {
            return 'analytics';
        } else if (lowerTitle.includes('news') || lowerTitle.includes('article')) {
            return 'newspaper';
        } else if (lowerTitle.includes('technical') || lowerTitle.includes('indicator')) {
            return 'trending_up';
        } else {
            return 'image_search'; // default fallback
        }
    };

    return (
        <div className={className}>
            <h3 className="text-lg font-semibold mb-3 flex items-center text-primary">
                <span className="material-symbols-outlined mr-2">{getIconForTitle(title)}</span>
                {title}
            </h3>

            {validImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {validImages.map((image, index) => (
                        <div
                            key={`${image.url}-${index}`}
                            className="relative group cursor-pointer rounded-lg overflow-hidden"
                        >
                            <ProxyImage
                                src={image.thumbnail || image.url}
                                alt={image.title}
                                className="w-full h-24 object-cover"
                                onError={() => handleImageError(image.thumbnail || image.url)}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-sm p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-secondary">
                    No images available to display.
                </div>
            )}
        </div>
    );
};