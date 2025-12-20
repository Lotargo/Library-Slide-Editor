import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Grid, LayoutTemplate, X } from 'lucide-react';

export default function GalleryBlock({ block, onUpdate }) {
    // block.content: string[] | { url, thumbnail_url }[]
    const rawImages = Array.isArray(block.content) ? block.content : (block.content ? [block.content] : []);

    // Normalize to objects
    const images = rawImages.map(img => {
        if (typeof img === 'string') return { url: img, thumbnail_url: img };
        return img;
    });

    const viewMode = block.viewMode || 'grid';
    const [activeIndex, setActiveIndex] = useState(0); // For inline carousel
    const [lightboxIndex, setLightboxIndex] = useState(null); // For full screen overlay

    const toggleViewMode = () => {
        onUpdate({ viewMode: viewMode === 'grid' ? 'carousel' : 'grid' });
    };

    const openLightbox = (index) => setLightboxIndex(index);
    const closeLightbox = () => setLightboxIndex(null);

    const nextImage = (e) => {
        e?.stopPropagation();
        setActiveIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e) => {
        e?.stopPropagation();
        setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    // Lightbox Navigation
    const nextLightbox = (e) => {
        e?.stopPropagation();
        setLightboxIndex((prev) => (prev + 1) % images.length);
    };

    const prevLightbox = (e) => {
        e?.stopPropagation();
        setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    // Keyboard support for lightbox
    useEffect(() => {
        if (lightboxIndex === null) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') nextLightbox();
            if (e.key === 'ArrowLeft') prevLightbox();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxIndex]);

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
                    {images.map((img, idx) => (
                        <div
                            key={idx}
                            className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => openLightbox(idx)}
                        >
                            <img
                                src={img.thumbnail_url}
                                alt={`Gallery item ${idx + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="relative bg-gray-100 rounded-lg overflow-hidden border border-gray-200 aspect-video flex items-center justify-center group/carousel">
                     {/* Carousel Image */}
                     <img
                        src={images[activeIndex].url}
                        alt={`Slide ${activeIndex + 1}`}
                        className="max-h-full max-w-full object-contain cursor-zoom-in"
                        onClick={() => openLightbox(activeIndex)}
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

            {/* Lightbox Overlay */}
            {lightboxIndex !== null && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center backdrop-blur-sm"
                    onClick={closeLightbox}
                >
                    <button
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 text-white/70 hover:text-white p-2 transition-colors"
                    >
                        <X size={32} />
                    </button>

                    <img
                        src={images[lightboxIndex].url}
                        alt="Full screen"
                        className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {images.length > 1 && (
                        <>
                             <button
                                onClick={prevLightbox}
                                className="absolute left-4 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <ChevronLeft size={48} />
                            </button>
                            <button
                                onClick={nextLightbox}
                                className="absolute right-4 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <ChevronRight size={48} />
                            </button>
                        </>
                    )}

                    <div className="absolute bottom-4 text-white/50 text-sm select-none">
                        {lightboxIndex + 1} / {images.length}
                    </div>
                </div>
            )}
        </div>
    );
}
