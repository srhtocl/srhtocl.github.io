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

import React, { useState, useEffect } from 'react';
import { FiTrash2, FiX, FiChevronLeft, FiChevronRight, FiShare2, FiUserCheck, FiMoreVertical } from 'react-icons/fi';
import { useAuth } from '../context/auth-context';
import { useGallery } from '../hooks/useGallery';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "../services/firebase";
import { updateProfile } from "firebase/auth";
import toast from 'react-hot-toast';

const Gallery = () => {
    const { images, loading, removeImage } = useGallery();
    const [selectedImage, setSelectedImage] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    // Admin Check
    const isAdmin = user && user.uid === "2t2Fg2aX8ePpfhsDAWoYEosDcmv1";

    const handleDelete = async (imageItem) => {
        if (!window.confirm("Bu resmi kalıcı olarak silmek istiyor musunuz?")) return;

        const success = await removeImage(imageItem);
        if (success && selectedImage?.url === imageItem.url) {
            setSelectedImage(null);
        }
    };

    const handleReshare = (e, imageItem) => {
        e.stopPropagation();
        setSelectedImage(null);
        navigate('/create-post', { state: { reshareImageUrl: imageItem.url } });
    };

    const handleSetProfilePic = async (e, imageItem) => {
        e.stopPropagation();
        if (!window.confirm("Bu görseli profil resminiz yapmak istiyor musunuz?")) return;
        try {
            const adminProfileRef = doc(db, "admin", "profile");
            await setDoc(adminProfileRef, { photoURL: imageItem.url, updatedAt: new Date() }, { merge: true });
            
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { photoURL: imageItem.url });
            }
            toast.success("Profil resmi güncellendi! Değişikliklerin her yerde görünmesi için sayfa yenileniyor...");
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            console.error("Profil resmi güncellenemedi:", error);
            toast.error("Hata: " + error.message);
        }
    };

    // Global click listener to close menu
    useEffect(() => {
        const handleGlobalClick = () => setActiveMenu(null);
        window.addEventListener('click', handleGlobalClick);
        return () => window.removeEventListener('click', handleGlobalClick);
    }, []);

    const [dragStartX, setDragStartX] = useState(null);
    const [isSwiping, setIsSwiping] = useState(false);

    const handleNextImage = () => {
        if (!selectedImage) return;
        if (activeMenu === 'lightbox') setActiveMenu(null);
        const currentIndex = images.findIndex(img => img.url === selectedImage.url);
        if (currentIndex < images.length - 1) setSelectedImage(images[currentIndex + 1]);
    };

    const handlePrevImage = () => {
        if (!selectedImage) return;
        if (activeMenu === 'lightbox') setActiveMenu(null);
        const currentIndex = images.findIndex(img => img.url === selectedImage.url);
        if (currentIndex > 0) setSelectedImage(images[currentIndex - 1]);
    };

    const handleSwipeStart = (e) => {
        const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        setDragStartX(clientX);
        setIsSwiping(false);
    };

    const handleSwipeEnd = (e) => {
        if (dragStartX === null) return;
        const clientX = e.type.includes('mouse') ? e.clientX : e.changedTouches[0].clientX;
        const distance = dragStartX - clientX;
        setDragStartX(null);

        if (Math.abs(distance) > 50) {
            setIsSwiping(true);
            if (distance > 50) {
                handleNextImage();
            } else {
                handlePrevImage();
            }
            setTimeout(() => setIsSwiping(false), 50);
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
                            <div key={idx} className="relative group aspect-square rounded-xl bg-slate-200 cursor-pointer border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                
                                {/* Image and Hover Overlay (Hidden Overflow for scaling effect) */}
                                <div className="absolute inset-0 overflow-hidden rounded-xl">
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

                                {/* Grid Context Menu (Outside of overflow-hidden) */}
                                {isAdmin && (
                                    <div className="absolute top-2 right-2 z-20">
                                        <button 
                                            className={`p-1.5 bg-black/40 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-all border border-white/10 ${activeMenu === img.url ? 'opacity-100 bg-black/70 ring-2 ring-white/20' : 'opacity-0 group-hover:opacity-100'}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenu(activeMenu === img.url ? null : img.url);
                                            }}
                                        >
                                            <FiMoreVertical size={16} />
                                        </button>
                                        
                                        {activeMenu === img.url && (
                                            <div className="absolute top-0 right-0 w-36 bg-white/95 backdrop-blur-xl border border-white/40 rounded-xl shadow-2xl p-1 animate-in fade-in zoom-in-95 z-30 origin-top-right" onClick={(e) => e.stopPropagation()}>
                                                <button className="w-full px-2.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2.5 transition-colors" onClick={(e) => { setActiveMenu(null); handleReshare(e, img); }}>
                                                    <FiShare2 size={14} className="text-blue-600" />
                                                    Paylaş
                                                </button>
                                                <button className="w-full px-2.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2.5 transition-colors" onClick={(e) => { setActiveMenu(null); handleSetProfilePic(e, img); }}>
                                                    <FiUserCheck size={14} className="text-green-600" />
                                                    Profil Yap
                                                </button>
                                                <div className="h-px bg-slate-100/80 my-1 mx-1.5"></div>
                                                <button className="w-full px-2.5 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2.5 transition-colors" onClick={(e) => { e.stopPropagation(); setActiveMenu(null); handleDelete(img); }}>
                                                    <FiTrash2 size={14} />
                                                    Sil
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox Modal */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200"
                    onMouseDown={handleSwipeStart}
                    onMouseUp={handleSwipeEnd}
                    onTouchStart={handleSwipeStart}
                    onTouchEnd={handleSwipeEnd}
                    onClick={() => {
                        if (isSwiping) return;
                        if (activeMenu === 'lightbox') {
                            setActiveMenu(null);
                        } else {
                            setSelectedImage(null);
                        }
                    }}
                >

                    {/* Header Gradient Overlay */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/90 via-black/50 to-transparent z-40 pointer-events-none" />

                    {/* Actions Menu (Top Right) */}
                    <div className="absolute top-4 right-4 z-50">
                        <button
                            className={`p-2 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all border border-white/10 ${activeMenu === 'lightbox' ? 'bg-white/20 ring-2 ring-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-white/10'}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenu(activeMenu === 'lightbox' ? null : 'lightbox');
                            }}
                        >
                            <FiMoreVertical size={20} />
                        </button>
                        
                        {activeMenu === 'lightbox' && (
                            <div className="absolute top-0 right-0 w-48 bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-1.5 animate-in fade-in zoom-in-95 origin-top-right" onClick={(e) => e.stopPropagation()}>
                                {/* Admin options */}
                                {isAdmin && (
                                    <>
                                        <button className="w-full px-3 py-2 text-left text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white rounded-xl flex items-center gap-3 transition-colors" onClick={(e) => { setActiveMenu(null); handleReshare(e, selectedImage); }}>
                                            <FiShare2 size={16} className="text-blue-400" />
                                            Yeniden Paylaş
                                        </button>
                                        <button className="w-full px-3 py-2 text-left text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white rounded-xl flex items-center gap-3 transition-colors" onClick={(e) => { setActiveMenu(null); handleSetProfilePic(e, selectedImage); }}>
                                            <FiUserCheck size={16} className="text-green-400" />
                                            Profil Resmi Yap
                                        </button>
                                        <div className="h-px bg-white/10 my-1 mx-2"></div>
                                        <button className="w-full px-3 py-2 text-left text-sm font-medium text-red-400 hover:bg-red-500/20 rounded-xl flex items-center gap-3 transition-colors" onClick={(e) => { e.stopPropagation(); setActiveMenu(null); handleDelete(selectedImage); }}>
                                            <FiTrash2 size={16} />
                                            Kalıcı Olarak Sil
                                        </button>
                                        <div className="h-px bg-white/10 my-1 mx-2"></div>
                                    </>
                                )}
                                <button className="w-full px-3 py-2 text-left text-sm font-medium text-white hover:bg-white/10 rounded-xl flex items-center gap-3 transition-colors" onClick={() => { setActiveMenu(null); setSelectedImage(null); }}>
                                    <FiX size={16} />
                                    Tam Ekranı Kapat
                                </button>
                            </div>
                        )}
                    </div>

                    <img
                        src={selectedImage.url}
                        alt="Full View"
                        className="max-w-[90vw] max-h-[90vh] object-contain animate-in zoom-in-95 duration-300 select-none relative z-30 cursor-grab active:cursor-grabbing"
                        onDragStart={(e) => e.preventDefault()}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isSwiping) return;
                            if (activeMenu === 'lightbox') setActiveMenu(null);
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default Gallery;
