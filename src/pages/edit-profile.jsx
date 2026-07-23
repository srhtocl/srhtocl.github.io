/**
 * @file edit-profile.jsx
 * @description Yönetici profili düzenleme sayfası. Yenilenmiş arayüz.
 *
 * Özellikler:
 * - Çoklu profil fotoğrafı yönetimi (yeni yükleme + galeriden seçme)
 * - Sürükle-bırak ile sıralama (drag & drop)
 * - visibleCount seçici (1 / 3 / 5 / 7)
 * - photoURLs[0] otomatik "kapak" sayılır
 * - Biyografi / söz alanı
 *
 * @dependencies
 * - src/hooks/useProfile.js
 * - src/components/gallery-picker.jsx
 *
 * @date 2026-07-20
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/auth-context';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiMenu } from 'react-icons/fi';
import { useProfile } from '../hooks/useProfile';
import GalleryPicker from '../components/gallery-picker';
import { toast } from 'react-hot-toast';

// Fotoğraf ekleme kuralı: max 7, her zaman tek sayı (1, 3, 5, 7)
const MAX_PHOTOS = 7;



const EditProfile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { profile, loading, fetching, updateProfileData } = useProfile();

    // Form Local State
    const [bioInput, setBioInput] = useState('');
    const [displayNameInput, setDisplayNameInput] = useState('');
    const [usernameInput, setUsernameInput] = useState('');
    const [photoList, setPhotoList] = useState([]);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    const dragIndex = React.useRef(null);

    useEffect(() => {
        if (profile) {
            setBioInput(profile.bio || '');
            setDisplayNameInput(profile.displayName || '');
            setUsernameInput(profile.username || '');
            setPhotoList(
                (profile.photoURLs || []).map(url => ({ url, isNew: false }))
            );
        }
    }, [profile]);

    // Auth guard
    useEffect(() => {
        if (!user) navigate('/');
    }, [user, navigate]);

    // ── Fotoğraf Seçimi — Galeriden Seç ─────────────────────────────────
    const handleGalleryConfirm = (selectedUrls) => {
        // Kural kontrolü
        if (selectedUrls.length > 7) {
            toast.error(`En fazla 7 fotoğraf seçebilirsiniz.`);
            return;
        }
        if (selectedUrls.length > 0 && selectedUrls.length % 2 === 0) {
            toast.error('Fotoğraf sayısı çift olamaz (1, 3, 5 veya 7 olmalı).');
            return;
        }
        setPhotoList(prev => {
            const currentUrls = prev.map(p => p.url);
            // Keep items that are still selected, preserving their current order
            const kept = prev.filter(p => selectedUrls.includes(p.url));
            // Add new items from selectedUrls that were not in prev
            const newUrls = selectedUrls.filter(u => !currentUrls.includes(u));
            const added = newUrls.map(url => ({ url, isNew: false })); // They are already in gallery
            return [...kept, ...added];
        });
    };

    // ── Sürükle-Bırak ile Sıralama ─────────────────────────────────────────
    const handleDragStart = (e, index) => {
        dragIndex.current = index;
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (dragIndex.current === null || dragIndex.current === index) return;
        setPhotoList(prev => {
            const next = [...prev];
            const [dragged] = next.splice(dragIndex.current, 1);
            next.splice(index, 0, dragged);
            dragIndex.current = index;
            return next;
        });
    };

    const handleDragEnd = () => { dragIndex.current = null; };

    const handleSave = async () => {
        const orderedUrls = photoList.map(p => p.url);

        const success = await updateProfileData({
            orderedPhotoURLs: orderedUrls,
            newBio: bioInput,
            newDisplayName: displayNameInput,
            newUsername: usernameInput
        });

        if (success) setTimeout(() => navigate(0), 800);
    };

    // ── Yükleniyor ─────────────────────────────────────────────────────────
    if (fetching) {
        return (
            <div className="flex justify-center items-center h-full bg-slate-50">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
            </div>
        );
    }

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="w-full h-full flex flex-col font-['Ubuntu'] bg-slate-50 overflow-y-auto">

            {/* ─── İçerik ──────────────────────────────────────────────── */}
            <div className="flex-1 w-full max-w-2xl mx-auto px-3 sm:px-5 py-8 space-y-8">

                {/* ── Bölüm 1: Profil Fotoğrafları ─────────────────────── */}
                <section>

                    {/* 7 Eşit Slot — Tek Satır (Sıklaştırıldı) */}
                    <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-4">
                        {/* Dolu slotlar */}
                        {photoList.map((photo, idx) => (
                                <PhotoCard
                                    key={photo.url}
                                    photo={photo}
                                    index={idx}
                                    onDragStart={handleDragStart}
                                    onDragOver={handleDragOver}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => setIsGalleryOpen(true)}
                                />
                        ))}
                        {/* Boş slotlar */}
                        {Array.from({ length: Math.max(0, 7 - photoList.length) }).map((_, i) => (
                            <EmptySlot
                                key={`empty-${i}`}
                                onClick={() => setIsGalleryOpen(true)}
                            />
                        ))}
                    </div>
                </section>


                {/* ── Bölüm 2: Kişisel Bilgiler ────────────────────────── */}
                <section className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1">AD SOYAD VEYA MARKA</label>
                        <input
                            type="text"
                            value={displayNameInput}
                            onChange={e => setDisplayNameInput(e.target.value)}
                            placeholder="Ad Soyad"
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-800 outline-none focus:border-slate-700 focus:ring-2 focus:ring-slate-200 transition-all font-medium placeholder:text-slate-300 shadow-sm"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1">KULLANICI ADI</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">@</span>
                            <input
                                type="text"
                                value={usernameInput}
                                onChange={e => setUsernameInput(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                                placeholder="kullaniciadi"
                                className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-9 pr-4 text-slate-800 outline-none focus:border-slate-700 focus:ring-2 focus:ring-slate-200 transition-all font-medium placeholder:text-slate-300 shadow-sm"
                            />
                        </div>
                    </div>
                </section>

                {/* ── Bölüm 3: Biyografi ───────────────────────────────── */}
                <section>
                    <div className="relative">
                        <textarea
                            value={bioInput}
                            onChange={e => setBioInput(e.target.value)}
                            placeholder="Bir-iki kelime bile sessizlikten iyidir..."
                            rows={4}
                            className="w-full bg-white border border-slate-200 rounded-xl py-4 px-4 text-slate-800 outline-none focus:border-slate-700 focus:ring-2 focus:ring-slate-200 transition-all font-['Marck_Script'] text-xl text-center placeholder:text-slate-300 placeholder:font-['Ubuntu'] placeholder:text-sm shadow-sm resize-none"
                        />
                    </div>
                </section>

            </div>

            {/* ─── Footer: Kaydet ──────────────────────────────────────── */}
            <div className="sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-slate-100 px-5 py-4">
                <div className="w-full max-w-2xl mx-auto">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold tracking-wide shadow-lg shadow-slate-900/10 hover:bg-slate-700 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Kaydediliyor...
                            </span>
                        ) : 'Kaydet'}
                    </button>
                </div>
            </div>

            {/* ─── Galeri Seçici Modal ──────────────────────────────────── */}
            <GalleryPicker
                isOpen={isGalleryOpen}
                onClose={() => setIsGalleryOpen(false)}
                onConfirm={handleGalleryConfirm}
                alreadySelected={photoList.map(p => p.url)}
            />

        </div>
    );
};

// ── Alt Bileşenler ─────────────────────────────────────────────────────────

/** Boş slot (tıklanabilir, yeni fotoğraf ekler) */
const EmptySlot = ({ onClick }) => (
    <button
        onClick={onClick}
        className="aspect-square rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-slate-400 hover:bg-slate-100 transition-all flex items-center justify-center text-slate-300 hover:text-slate-400 group"
        aria-label="Fotoğraf ekle"
        title="Tıkla: yeni fotoğraf yükle"
    >
        <FiPlus size={16} className="group-hover:scale-110 transition-transform" />
    </button>
);

/** Tekil fotoğraf kartı (sürükle-bırak) */
const PhotoCard = ({ photo, index, onDragStart, onDragOver, onDragEnd, onClick }) => (
    <div
        draggable
        onClick={onClick}
        onDragStart={e => onDragStart(e, index)}
        onDragOver={e => onDragOver(e, index)}
        onDragEnd={onDragEnd}
        className="relative group aspect-square rounded-xl overflow-hidden bg-slate-200 cursor-grab active:cursor-grabbing border-2 border-transparent hover:border-slate-300 transition-all shadow-sm"
    >
        <img
            src={photo.url}
            alt={`Profil ${index + 1}`}
            className="w-full h-full object-cover"
            draggable={false}
        />

        {/* Karartma overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />

        {/* Sürükleme tutacağı */}
        <div className="absolute bottom-1.5 left-1.5 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
            <FiMenu size={14} />
        </div>

        {/* Yeni yükleme rozeti */}
        {photo.isNew && (
            <div className="absolute bottom-1.5 right-1.5 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
                Yeni
            </div>
        )}
    </div>
);

export default EditProfile;
