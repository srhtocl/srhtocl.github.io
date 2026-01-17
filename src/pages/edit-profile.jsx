/**
 * @file edit-profile.jsx
 * @description Yönetici profili düzenleme sayfası. 
 * Kullanıcının biyografi (bio) ve profil fotoğrafını (photoURL) değiştirmesine olanak tanır.
 * 
 * @dependencies
 * - src/hooks/useProfile.js (Tüm iş mantığı ve veri yönetimi)
 * - src/components/avatar-upload.jsx (Görsel yükleme UI - Entegreli)
 * 
 * @date 2026-01-17
 * @author [AI Assistant]
 * 
 * @notes
 * - İş mantığı tamamen `useProfile` hook'una taşınmıştır.
 * - Bu bileşen artık "Tyhm (Aptal)" bileşen prensibine yakındır; sadece UI ve Input state'i tutar.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/auth-context';
import { useNavigate } from 'react-router-dom';
import { FiCamera, FiUser } from "react-icons/fi";
import { useProfile } from '../hooks/useProfile';

const EditProfile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Hook'tan gelen veriler ve fonksiyonlar
    const { profile, loading, fetching, updateProfileData } = useProfile();

    // Form Local State (Kullanıcı yazarken anlık değişim için)
    const [bioInput, setBioInput] = useState('');
    const [imageFile, setImageFile] = useState(null);

    // Profil değiştiğinde (ilk yüklendiğinde) input'ları güncelle
    useEffect(() => {
        if (profile) {
            setBioInput(profile.bio);
        }
    }, [profile]);

    const fileInputRef = useRef(null);

    // Initial Auth Check
    useEffect(() => {
        if (!user) {
            navigate("/");
        }
    }, [user, navigate]);


    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    const handleSave = async () => {
        // İş mantığı tamamen hook içinde kapsüllendi
        const success = await updateProfileData(imageFile, bioInput);
        if (success) {
            // İsteğe bağlı: UI temizliği veya yönlendirme gecikmesi
            setTimeout(() => navigate(0), 1000);
        }
    };

    // Determine the image to show (Preview > Current Profile > Default)
    const currentImageSrc = imageFile
        ? URL.createObjectURL(imageFile)
        : (profile.photoURL || null);

    if (fetching) {
        return (
            <div className="flex justify-center pt-20 h-full bg-slate-50">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col font-['Ubuntu'] bg-slate-50 overflow-y-auto">

            {/* Content Container */}
            <div className="flex-1 w-full max-w-2xl mx-auto p-6 space-y-8">

                {/* Form Section */}
                <div className="space-y-8 pt-8 flex flex-col items-center">

                    {/* Avatar Upload Area */}
                    <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                        <div className="w-32 h-32 rounded-full ring-4 ring-white shadow-lg overflow-hidden relative bg-slate-200 flex items-center justify-center">
                            {currentImageSrc ? (
                                <img
                                    src={currentImageSrc}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <FiUser className="text-slate-400 text-5xl" />
                            )}
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <FiCamera className="text-white text-3xl drop-shadow-md" />
                            </div>
                        </div>
                        <div className="absolute bottom-0 right-0 bg-slate-900 text-white p-2 rounded-full shadow-md border-2 border-white hover:bg-blue-600 transition-colors">
                            <FiCamera size={16} />
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>

                    {/* Bio / Quote Input */}
                    <div className="w-full space-y-3">
                        <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider block text-center">Biyografi / Söz</label>
                        <div className="relative">
                            <textarea
                                value={bioInput}
                                onChange={(e) => setBioInput(e.target.value)}
                                placeholder="Bir-iki kelime bile sessizlikten iyidir..."
                                className="w-full bg-white border border-slate-200 rounded-xl py-4 px-4 text-slate-800 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all font-medium placeholder:text-slate-300 shadow-sm min-h-[120px] resize-y font-['Marck_Script'] text-xl text-center"
                            />
                        </div>
                    </div>

                </div>

            </div>

            {/* Action Footer */}
            <div className="p-6 bg-transparent sticky bottom-0 z-10 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-xl font-bold tracking-wide shadow-xl shadow-slate-900/10 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? "Kaydediliyor..." : "KAYDET"}
                </button>
            </div>

        </div>
    );
};

export default EditProfile;
