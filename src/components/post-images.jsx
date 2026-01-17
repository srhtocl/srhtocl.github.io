/**
 * @file post-images.jsx
 * @description Gönderi içindeki görselleri, slider yapısını ve metin (caption) gösterimini yöneten UI bileşeni.
 * Akıllı en-boy oranı (Smart Aspect Ratio), bulanık arka plan ve görsel hata yönetimi özelliklerine sahiptir.
 * 
 * @date 2026-01-17
 * @author [AI Assistant]
 * 
 * @dependencies
 * - react-icons/fi (İkonlar)
 * 
 * @notes
 * - Sadece "Görünüm"den sorumludur (Dumb Component).
 * - Veri manipülasyonu yapmaz, sadece props ile gelen veriyi gösterir.
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FiEdit2 } from 'react-icons/fi';

/**
 * Gönderi görsellerini ve slider mantığını yöneten alt bileşen.
 * 
 * @param {Array} images - Gösterilecek görsellerin URL listesi
 * @param {string} content - Resim üzerine tıklandığında gösterilecek metin (caption)
 * @returns {JSX.Element}
 */
const PostImages = ({ images, content }) => {
    const [showCaption, setShowCaption] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [failedImages, setFailedImages] = useState({});

    const handleImageError = (index) => {
        setFailedImages(prev => ({ ...prev, [index]: true }));
    };

    // Hatalı olmayan resimleri filtrele
    const validImages = images.map((url, index) => ({ url, originalIndex: index }))
        .filter(item => !failedImages[item.originalIndex]);

    if (validImages.length === 0) return null;

    return (
        <div className="relative w-full rounded-lg overflow-hidden group/image">

            {/* Image Slider (Horizontal Scroll) */}
            <div
                className="flex flex-row overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full scroll-smooth"
                onClick={() => setShowCaption(!showCaption)}
                onScroll={(e) => {
                    const slideWidth = e.currentTarget.offsetWidth;
                    const currentScroll = e.currentTarget.scrollLeft;
                    const index = Math.round(currentScroll / slideWidth);
                    setActiveIndex(index);
                }}
            >
                {validImages.map((imageItem, idx) => (
                    <div key={imageItem.originalIndex} className="w-full flex-shrink-0 snap-center relative h-[500px] flex items-center justify-center bg-slate-100 overflow-hidden">

                        {/* Layer 1: Blurred Background (Fills the gaps) */}
                        <img
                            src={imageItem.url}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-50 scale-110"
                            onError={() => handleImageError(imageItem.originalIndex)}
                        />

                        {/* Layer 2: Main Image (Centered & Uncropped) */}
                        <img
                            src={imageItem.url}
                            alt={`slide-${idx}`}
                            className="relative w-full h-full object-contain z-10 drop-shadow-md transition-transform duration-300"
                            loading="lazy"
                            onError={() => handleImageError(imageItem.originalIndex)}
                        />
                    </div>
                ))}
            </div>

            {/* Text Overlay (Bottom Sheet) */}
            {showCaption && (
                <div
                    className="absolute bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-sm p-4 text-white/90 font-['Ubuntu'] text-sm leading-relaxed max-h-[60%] overflow-y-auto animate-in slide-in-from-bottom-5 duration-200 z-10"
                    onClick={() => setShowCaption(false)}
                >
                    <div className="mx-auto w-12 h-1 bg-white/20 rounded-full mb-3"></div>
                    {content}
                </div>
            )}

            {/* Pagination Dots (Only if multiple valid images exist) */}
            {validImages.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 pointer-events-none">
                    {validImages.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 shadow-sm ${idx === activeIndex ? 'bg-white w-2.5 scale-110' : 'bg-white/50'}`}
                        />
                    ))}
                </div>
            )}

            {/* Click Hint (Optional, if caption hidden and HAS content) */}
            {!showCaption && content && (
                <div className="absolute bottom-3 right-3 bg-black/30 text-white p-1.5 rounded-full backdrop-blur-sm pointer-events-none opacity-50 group-hover/image:opacity-100 transition-opacity">
                    <FiEdit2 size={12} className="rotate-180" />
                </div>
            )}

        </div>
    );
};

PostImages.propTypes = {
    images: PropTypes.arrayOf(PropTypes.string).isRequired,
    content: PropTypes.string
};

export default PostImages;
