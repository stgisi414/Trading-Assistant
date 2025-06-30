import React, { useState } from 'react';
import type { ImageResult } from '../types.ts';

interface ImageGalleryProps {
    images: ImageResult[];
    title: string;
    className?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, title, className = '' }) => {
    const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

    if (!images || images.length === 0) {
        return null;
    }

    const handleImageError = (imageUrl: string) => {
        setImageErrors(prev => new Set([...prev, imageUrl]));
    };

    const handleImageClick = (image: ImageResult) => {
        if (image.contextLink) {
            window.open(image.contextLink, '_blank');
        } else {
            setSelectedImage(image);
        }
    };

    const validImages = images.filter(img => !imageErrors.has(img.url));

    return (
        <div className={`${className}`}>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                <span className="material-symbols-outlined mr-2 text-blue-500">image</span>
                {title}
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {validImages.map((image, index) => (
                    <div
                        key={`${image.url}-${index}`}
                        className="relative group cursor-pointer rounded-lg overflow-hidden glass-effect hover:shadow-lg transition-all duration-300"
                        onClick={() => handleImageClick(image)}
                    >
                        <img
                            src={image.thumbnail || image.url}
                            alt={image.title}
                            className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                // Try fallback to main URL if thumbnail fails
                                if (target.src === image.thumbnail && image.url !== image.thumbnail) {
                                    target.src = image.url;
                                } else {
                                    target.style.display = 'none';
                                    console.warn('Failed to load image:', target.src);
                                }
                            }}
                            loading="lazy"
                        />

                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="material-symbols-outlined text-white text-2xl">
                                    {image.contextLink ? 'open_in_new' : 'zoom_in'}
                                </span>
                            </div>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-white truncate flex-1">
                                    {image.title}
                                </span>
                                <span className={`text-xs px-1 py-0.5 rounded ${
                                    image.source === 'google' 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-purple-500 text-white'
                                }`}>
                                    {image.source === 'google' ? 'G' : 'AI'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal for full-size image viewing */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="max-w-4xl max-h-full relative">
                        <img
                            src={selectedImage.url}
                            alt={selectedImage.title}
                            className="max-w-full max-h-full object-contain rounded-lg"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                console.warn('Failed to load image:', image.url);
                            }}
                        />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-all"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                        <div className="absolute bottom-4 left-4 right-4 text-white">
                            <h4 className="text-lg font-semibold">{selectedImage.title}</h4>
                            <p className="text-sm opacity-75">Source: {selectedImage.source}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};