/**
 * @file profile-slider.jsx
 * @description Katmanlı yuvarlak profil fotoğrafı slider bileşeni.
 *
 * Kullanım:
 *   <ProfileSlider images={["url1", "url2", ...]} />
 *
 * @props
 *   images {string[]} - Fotoğraf URL dizisi (her zaman tek sayı, max 7)
 *
 * @notes
 *   - Harici kütüphane kullanılmaz; saf CSS transform + React state.
 *   - Görünür katman sayısı images.length'ten otomatik hesaplanır.
 *   - 1 fotoğraf → klasik tek yuvarlak görünüm.
 *   - Döngüsel (circular) navigasyon.
 *   - Sürükle-bırak (mouse + touch) ve klavye yön tuşları desteklenir.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const SLOT_STYLES = {
    0:   { transform: 'translateX(0%)    scale(1.1)',  opacity: 1, zIndex: 10 },
    1:   { transform: 'translateX(25%)   scale(0.88)', opacity: 1, zIndex: 8  },
    '-1':{ transform: 'translateX(-25%)  scale(0.88)', opacity: 1, zIndex: 8  },
    2:   { transform: 'translateX(45%)   scale(0.72)', opacity: 1, zIndex: 6  },
    '-2':{ transform: 'translateX(-45%)  scale(0.72)', opacity: 1, zIndex: 6  },
    3:   { transform: 'translateX(60%)   scale(0.58)', opacity: 1, zIndex: 4  },
    '-3':{ transform: 'translateX(-60%)  scale(0.58)', opacity: 1, zIndex: 4  },
};

const ProfileSlider = ({ images = [] }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const dragStartX = useRef(null);
    const isDragging = useRef(false);

    const total = images.length;
    // Görünür kenar slot sayısı: fotoğraf sayısından otomatik (1→0, 3→1, 5→2, 7→3)
    const maxOffset = Math.floor(total / 2);

    const moveNext = useCallback(() => setActiveIndex(prev => (prev + 1) % total), [total]);
    const movePrev = useCallback(() => setActiveIndex(prev => (prev - 1 + total) % total), [total]);

    const handleDragStart = (e) => {
        dragStartX.current = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        isDragging.current = true;
    };
    const handleDragMove = (e) => {
        if (!isDragging.current || dragStartX.current === null) return;
        const x = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        const diff = x - dragStartX.current;
        if (diff > 50)  { movePrev(); isDragging.current = false; }
        if (diff < -50) { moveNext(); isDragging.current = false; }
    };
    const handleDragEnd = () => { isDragging.current = false; };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowRight') moveNext();
        if (e.key === 'ArrowLeft')  movePrev();
    };

    // Global esc tuşu ile kapatma
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
            if (e.key === 'ArrowRight' && isFullscreen) moveNext();
            if (e.key === 'ArrowLeft' && isFullscreen) movePrev();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isFullscreen, moveNext, movePrev]);

    if (total === 0) return null;

    const renderLightbox = () => {
        if (!isFullscreen) return null;
        return (
            <div 
                className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col animate-in fade-in duration-200"
                onClick={() => setIsFullscreen(false)}
            >
                {/* Header */}
                <div className="absolute top-0 right-0 p-4 md:p-6 z-50">
                    <button 
                        onClick={() => setIsFullscreen(false)}
                        className="p-2.5 bg-white/10 hover:bg-white/25 rounded-full text-white backdrop-blur-sm transition-all"
                        aria-label="Kapat"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                {/* Image Area */}
                <div 
                    className="flex-1 w-full h-full flex items-center justify-center relative px-4 md:px-16"
                    onClick={(e) => e.stopPropagation()}
                    onTouchStart={handleDragStart}
                    onTouchMove={handleDragMove}
                    onTouchEnd={handleDragEnd}
                    onMouseDown={handleDragStart}
                    onMouseMove={handleDragMove}
                    onMouseUp={handleDragEnd}
                    onMouseLeave={handleDragEnd}
                >
                    <img 
                        src={images[activeIndex]} 
                        alt="Tam Ekran Profil" 
                        className="max-w-full max-h-full object-contain select-none shadow-2xl rounded-sm"
                        draggable={false}
                    />
                    
                    {/* Nav Buttons */}
                    {total > 1 && (
                        <>
                            <button 
                                onClick={(e) => { e.stopPropagation(); movePrev(); }}
                                className="absolute left-2 md:left-6 p-2.5 bg-white/10 hover:bg-white/25 rounded-full text-white backdrop-blur-sm transition-all"
                            >
                                <FiChevronLeft size={28} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); moveNext(); }}
                                className="absolute right-2 md:right-6 p-2.5 bg-white/10 hover:bg-white/25 rounded-full text-white backdrop-blur-sm transition-all"
                            >
                                <FiChevronRight size={28} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    };

    // Tek fotoğrafta sade görünüm (sürükleme yok)
    if (total === 1) {
        return (
            <>
                <div className="flex items-center justify-center">
                    <div 
                        className="w-40 h-40 md:w-56 md:h-56 rounded-full overflow-hidden ring-4 ring-white/50 shadow-2xl cursor-pointer transition-transform hover:scale-105 active:scale-95"
                        onClick={() => setIsFullscreen(true)}
                    >
                        <img src={images[0]} alt="Profil fotoğrafı" className="w-full h-full object-cover" />
                    </div>
                </div>
                {renderLightbox()}
            </>
        );
    }

    return (
        <div
            className="relative flex items-center justify-center select-none outline-none"
            style={{ width: '100%', height: 'clamp(180px, 50vw, 240px)' }}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
            aria-label="Profil fotoğrafları"
            role="region"
        >
            {images.map((url, index) => {
                let offset = index - activeIndex;
                const half = Math.floor(total / 2);
                if (offset > half)  offset -= total;
                if (offset < -half) offset += total;

                const absOffset = Math.abs(offset);
                if (absOffset > maxOffset + 1) return null;

                const isHidden = absOffset > maxOffset;
                const style = SLOT_STYLES[String(offset)] ?? {
                    transform: offset > 0 ? 'translateX(120%) scale(0.4)' : 'translateX(-120%) scale(0.4)',
                    opacity: 0,
                    zIndex: 0
                };

                return (
                    <div
                        key={url + index}
                        onClick={() => {
                            if (!isHidden) {
                                if (offset === 0) setIsFullscreen(true);
                                else setActiveIndex(index);
                            }
                        }}
                        style={{
                            position: 'absolute',
                            width: 'clamp(120px, 40vw, 180px)',
                            height: 'clamp(120px, 40vw, 180px)',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            transition: 'all 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: offset === 0 ? 'default' : 'pointer',
                            boxShadow: offset === 0 ? '0 20px 40px -10px rgba(0,0,0,0.35)' : '0 8px 20px -5px rgba(0,0,0,0.2)',
                            border: offset === 0 ? '3px solid rgba(255,255,255,0.7)' : '2px solid rgba(255,255,255,0.3)',
                            pointerEvents: isHidden ? 'none' : 'auto',
                            ...style
                        }}
                        aria-label={`Fotoğraf ${index + 1}`}
                    >
                        <img
                            src={url}
                            alt={`Profil ${index + 1}`}
                            className="w-full h-full object-cover"
                            draggable={false}
                            style={{ filter: offset === 0 ? 'none' : 'grayscale(80%)', transition: 'filter 0.4s ease' }}
                        />
                    </div>
                );
            })}
            
            {renderLightbox()}
        </div>
    );
};

ProfileSlider.propTypes = {
    images: PropTypes.arrayOf(PropTypes.string)
};

export default ProfileSlider;
