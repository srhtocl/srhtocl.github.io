/**
 * @file gallery.jsx
 * @description Tüm resimlerin listelendiği Galeri sayfası.
 * Grid görünümü ve Lightbox (Tam ekran) modu içerir.
 * 
 * @dependencies
 * - src/hooks/useGallery.js (Veri ve State yönetimi)
 * - src/services/gallery-service.js (Dolaylı olarak)
 * 
 * @date 2026-01-18
 * @author [AI Assistant]
 */

import React, { useState } from 'react';
import { FiTrash2, FiMaximize2, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../context/auth-context';
import { useGallery } from '../hooks/useGallery';
import { toast } from 'react-hot-toast';

const Gallery = () => {
    const { images, loading, removeImage } = useGallery();
    const [selectedImage, setSelectedImage] = useState(null);
    const { user } = useAuth();

    // Admin Check
    const isAdmin = user && user.uid === "2t2Fg2aX8ePpfhsDAWoYEosDcmv1";

    const handleDelete = async (imageItem) => {
        if (!window.confirm("Bu resmi kalıcı olarak silmek istiyor musunuz?")) return;

        const success = await removeImage(imageItem);
        if (success && selectedImage?.url === imageItem.url) {
            setSelectedImage(null);
        }
    };

    return (
        <div className="w-full h-full flex flex-col font-['Ubuntu'] bg-slate-50 overflow-y-auto">

            {/* Grid */}
            <div className="flex-1 p-6">
                {loading ? (
                    <div className="flex justify-center pt-20">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
                    </div>
                ) : images.length === 0 ? (
                    <div className="text-center text-slate-400 pt-20">Hiç resim yok.</div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.map((img, idx) => (
                            <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-200 cursor-pointer border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                <img
                                    src={img.url}
                                    alt="Gallery Item"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    onClick={() => setSelectedImage(img)}
                                    loading="lazy"
                                />

                                {/* No Overlay - Just Click to Open */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200" onClick={() => setSelectedImage(null)}>

                    {/* Header Gradient Overlay */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/90 via-black/50 to-transparent z-40 pointer-events-none" />

                    {/* Close Button */}
                    <button
                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all z-50 border border-white/5"
                        onClick={() => setSelectedImage(null)}
                    >
                        <FiX size={24} />
                    </button>

                    {/* Navigation Buttons */}
                    <button
                        className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-40 disabled:opacity-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            const currentIndex = images.findIndex(img => img.url === selectedImage.url);
                            if (currentIndex > 0) setSelectedImage(images[currentIndex - 1]);
                        }}
                        disabled={images.findIndex(img => img.url === selectedImage.url) === 0}
                    >
                        <FiChevronLeft size={48} />
                    </button>

                    <button
                        className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-40 disabled:opacity-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            const currentIndex = images.findIndex(img => img.url === selectedImage.url);
                            if (currentIndex < images.length - 1) setSelectedImage(images[currentIndex + 1]);
                        }}
                        disabled={images.findIndex(img => img.url === selectedImage.url) === images.length - 1}
                    >
                        <FiChevronRight size={48} />
                    </button>

                    {/* Delete Button (Top Left) - Matching Style */}
                    {isAdmin && (
                        <button
                            className="absolute top-6 left-6 p-3 bg-white/10 hover:bg-red-600/90 text-white rounded-full backdrop-blur-md transition-all z-50 border border-white/5 flex items-center gap-2 group"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(selectedImage);
                            }}
                            title="Resmi Sil"
                        >
                            <FiTrash2 size={24} />
                            <span className="text-sm font-medium overflow-hidden w-0 group-hover:w-auto opacity-0 group-hover:opacity-100 transition-all duration-300">Sil</span>
                        </button>
                    )}

                    <img
                        src={selectedImage.url}
                        alt="Full View"
                        className="max-w-[90vw] max-h-[90vh] object-contain animate-in zoom-in-95 duration-300 select-none relative z-30"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default Gallery;
