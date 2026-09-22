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

    // --- Tam Ekran Görüntüleyici: Elle Sürükleme (Pointer Events) ---
    // Yatay sürükleme  → fotoğraflar arası geçiş (sadece total > 1 iken)
    // Dikey sürükleme  → yukarı veya aşağı bırakınca tam ekranı kapatır
    const LB_CLOSE_DISTANCE = 90;   // px — bu kadar dikey sürüklemede kapanır
    const LB_CLOSE_VELOCITY = 0.55; // px/ms — hızlı bir "flick" de kapatır
    const LB_SWIPE_RATIO = 0.2;     // ekran genişliğinin %20'si → sonraki/önceki foto

    const [lbDragX, setLbDragX] = useState(0);
    const [lbDragY, setLbDragY] = useState(0);
    const [lbAxis, setLbAxis] = useState(null); // 'x' | 'y' | null
    const [lbDragging, setLbDragging] = useState(false);
    const [lbClosing, setLbClosing] = useState(false);
    const [lbInstant, setLbInstant] = useState(false); // true: bir sonraki pozisyon değişimi geçişsiz (anlık) uygulanır
    const lbTrackRef = useRef(null);
    const lbStart = useRef({ x: 0, y: 0, t: 0 });
    const lbDraggingRef = useRef(false); // state güncellemesinin async olmasından etkilenmeyen anlık kontrol
    // Bir önceki swipe'ın CSS geçişi tam olarak bitmeden yeni bir sürüklemeye
    // izin vermemek için: sabit bir setTimeout süresi CSS'in gerçek süresiyle
    // (özellikle yavaş/kesintili etkileşimlerde) örtüşmeyebiliyor ve elindeki
    // fotoğraf beklenmedik şekilde değişiyormuş hissi veriyordu.
    const settlingModeRef = useRef(null); // 'next' | 'prev' | null — yatay swipe sonrası bekleyen index güncellemesi
    const closingRef = useRef(false);     // dikey swipe ile kapanış animasyonu sürüyor mu

    const closeLightbox = useCallback((direction = 0) => {
        if (direction === 0) {
            // Sürüklemesiz tek dokunuş: animasyon yok, hemen kapat.
            setIsFullscreen(false);
            return;
        }
        setLbClosing(true);
        closingRef.current = true;
        setLbAxis('y');
        setLbDragY(direction * (window.innerHeight || 800));
    }, []);

    // Eşik aşıldığında fotoğrafı tam olarak kaydırır; asıl index değişimi ve
    // geçişsiz "reset" işlemi ancak CSS geçişi GERÇEKTEN bitince (onTransitionEnd)
    // yapılır — sabit bir zamanlayıcıya güvenmiyoruz.
    const finishHorizontalDrag = useCallback((mode) => {
        if (mode === 'cancel') {
            setLbDragX(0);
            setLbAxis(null);
            return;
        }
        const width = lbTrackRef.current?.offsetWidth || window.innerWidth;
        settlingModeRef.current = mode;
        setLbDragX(mode === 'next' ? -width : width);
    }, []);

    // Track üzerindeki transform geçişi (sürükleme sonrası snap / next-prev / kapanış)
    // fiilen tamamlandığında tetiklenir. Aynı anda 3 slayt da "transform" ile
    // geçiş yaptığından birden fazla kez ateşlenebilir; ref bayrakları tek seferlik
    // işlem yapılmasını garanti eder.
    const handleLbTrackTransitionEnd = (e) => {
        if (e.propertyName !== 'transform') return;

        if (closingRef.current) {
            closingRef.current = false;
            setIsFullscreen(false);
            setLbClosing(false);
            setLbAxis(null);
            setLbDragX(0);
            setLbDragY(0);
            return;
        }

        const mode = settlingModeRef.current;
        if (!mode) return;
        settlingModeRef.current = null;
        if (mode === 'next') moveNext(); else movePrev();
        setLbInstant(true);
        setLbDragX(0);
        setLbAxis(null);
        requestAnimationFrame(() => requestAnimationFrame(() => setLbInstant(false)));
    };

    const handleLbPointerDown = (e) => {
        // Bir önceki geçiş (swipe sonrası yerleşme ya da kapanış) hâlâ sürüyorsa
        // yeni bir sürüklemeye başlamayı engelle — aksi halde eski geçiş bitince
        // devreye giren mantık, o an ekranda olanı beklenmedik şekilde değiştirebilir.
        if (lbClosing || closingRef.current || settlingModeRef.current) return;
        lbStart.current = { x: e.clientX, y: e.clientY, t: Date.now() };
        lbDraggingRef.current = true;
        setLbDragging(true);
        setLbAxis(null);
        e.currentTarget.setPointerCapture?.(e.pointerId);
    };

    const handleLbPointerMove = (e) => {
        if (!lbDraggingRef.current || lbClosing) return;
        const dx = e.clientX - lbStart.current.x;
        const dy = e.clientY - lbStart.current.y;

        let axis = lbAxis;
        if (!axis) {
            if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
            axis = (Math.abs(dx) > Math.abs(dy) && total > 1) ? 'x' : 'y';
            setLbAxis(axis);
        }

        if (axis === 'x') {
            setLbDragX(dx);
        } else {
            setLbDragY(dy);
        }
    };

    const handleLbPointerUp = () => {
        if (!lbDraggingRef.current) return;
        lbDraggingRef.current = false;
        setLbDragging(false);

        const elapsed = Math.max(Date.now() - lbStart.current.t, 1);

        // Sürükleme neredeyse hiç olmadıysa → tek dokunuş kabul edip kapat
        if (!lbAxis) {
            closeLightbox(0);
            return;
        }

        if (lbAxis === 'y') {
            const velocity = Math.abs(lbDragY) / elapsed;
            if (Math.abs(lbDragY) > LB_CLOSE_DISTANCE || velocity > LB_CLOSE_VELOCITY) {
                closeLightbox(lbDragY >= 0 ? 1 : -1);
                return;
            }
            setLbAxis(null);
            setLbDragY(0);
            return;
        }

        if (lbAxis === 'x') {
            const width = lbTrackRef.current?.offsetWidth || window.innerWidth;
            if (total > 1 && lbDragX < -width * LB_SWIPE_RATIO) {
                finishHorizontalDrag('next');
            } else if (total > 1 && lbDragX > width * LB_SWIPE_RATIO) {
                finishHorizontalDrag('prev');
            } else {
                finishHorizontalDrag('cancel');
            }
        }
    };

    if (total === 0) return null;

    const renderLightbox = () => {
        if (!isFullscreen) return null;

        // Sadece parmak/mouse hareket ederken (canlı sürüklerken) geçişi kapat;
        // bırakınca (snap-back / sonrakine geçiş / kapanış) CSS transition devreye girsin.
        const noTransition = lbDragging || lbInstant;
        const dxApplied = lbAxis === 'x' ? lbDragX : 0;
        const dyApplied = lbAxis === 'y' ? lbDragY : 0;
        const backdropOpacity = lbAxis === 'y'
            ? Math.max(0.95 - Math.min(Math.abs(lbDragY) / 400, 0.95), 0)
            : 0.95;

        const slots = total > 1 ? [-1, 0, 1] : [0];

        return (
            <div
                className="fixed inset-0 z-[100] flex flex-col backdrop-blur-md"
                style={{
                    backgroundColor: `rgba(0,0,0,${backdropOpacity})`,
                    transition: lbDragging ? 'none' : 'background-color 220ms ease-out'
                }}
            >
                <div
                    ref={lbTrackRef}
                    className="flex-1 w-full h-full relative overflow-hidden"
                    style={{ touchAction: 'none' }}
                    onPointerDown={handleLbPointerDown}
                    onPointerMove={handleLbPointerMove}
                    onPointerUp={handleLbPointerUp}
                    onPointerCancel={handleLbPointerUp}
                    onTransitionEnd={handleLbTrackTransitionEnd}
                >
                    {slots.map((offset) => {
                        const idx = (activeIndex + offset + total) % total;
                        return (
                            <div
                                key={idx}
                                className="absolute inset-0 flex items-center justify-center px-4 md:px-10"
                                style={{
                                    transform: `translate3d(calc(${offset * 100}% + ${dxApplied}px), ${dyApplied}px, 0)`,
                                    transition: noTransition ? 'none' : 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)'
                                }}
                            >
                                <img
                                    src={images[idx]}
                                    alt={`Profil ${idx + 1}`}
                                    className="max-w-full max-h-full object-contain select-none shadow-2xl"
                                    draggable={false}
                                />
                            </div>
                        );
                    })}
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
