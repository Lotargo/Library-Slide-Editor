import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Grid, LayoutTemplate } from 'lucide-react';

export default function GalleryBlock({ block, onUpdate }) {
    // block.content should be an array of image URLs
    // block.viewMode can be 'grid' or 'carousel' (default 'grid')

    const images = Array.isArray(block.content) ? block.content : (block.content ? [block.content] : []);
    const viewMode = block.viewMode || 'grid';
    const [activeIndex, setActiveIndex] = useState(0);

    const toggleViewMode = () => {
        onUpdate({ viewMode: viewMode === 'grid' ? 'carousel' : 'grid' });
    };

    const nextImage = () => {
        setActiveIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    if (images.length === 0) {
        return (
            <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg text-center text-gray-400 bg-gray-50">
                Empty Gallery
            </div>
        );
    }

    return (
        <div className="my-4 group relative">
            {/* Controls (visible on hover) */}
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={toggleViewMode}
                    className="bg-white/90 p-1.5 rounded shadow-sm border border-gray-200 text-gray-600 hover:text-blue-600"
                    title={viewMode === 'grid' ? "Switch to Carousel" : "Switch to Grid"}
                >
                    {viewMode === 'grid' ? <LayoutTemplate size={16} /> : <Grid size={16} />}
                </button>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((url, idx) => (
                        <div key={idx} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                            <img
                                src={url}
                                alt={`Gallery item ${idx + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="relative bg-gray-100 rounded-lg overflow-hidden border border-gray-200 aspect-video flex items-center justify-center">
                     {/* Carousel Image */}
                     <img
                        src={images[activeIndex]}
                        alt={`Slide ${activeIndex + 1}`}
                        className="max-h-full max-w-full object-contain"
                    />

                    {/* Navigation */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={prevImage}
                                className="absolute left-2 bg-white/80 hover:bg-white p-1 rounded-full shadow-md text-gray-700 transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={nextImage}
                                className="absolute right-2 bg-white/80 hover:bg-white p-1 rounded-full shadow-md text-gray-700 transition-colors"
                            >
                                <ChevronRight size={20} />
                            </button>
                            {/* Dots */}
                            <div className="absolute bottom-2 flex gap-1.5 bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">
                                {images.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`w-2 h-2 rounded-full transition-colors ${idx === activeIndex ? 'bg-white' : 'bg-white/50'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
