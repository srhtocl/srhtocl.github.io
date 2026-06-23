/**
 * @file useProfile.js
 * @description Profil yönetimi için gerekli tüm iş mantığını (Business Logic) kapsayan Custom Hook.
 * Bu hook; profil bilgilerini çekme (fetch), fotoğraf yükleme (upload), Firestore güncelleme ve 
 * profil değişikliği sonrası otomatik gönderi (Auto-Post) oluşturma süreçlerini yönetir.
 * 
 * @date 2026-01-17
 * @module Hooks
 * 
 * @notes
 * - Firebase Storage ve Firestore ile doğrudan konuşan katmandır.
 * - "Auto-Post" mantığı burada kapsüllenmiştir; UI bileşeni bununla ilgilenmez.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/auth-context';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, storage } from "../services/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { insertDocument } from '../services/post-methods';
import { toast } from "react-hot-toast";

/**
 * Profil verilerini ve güncelleme işlemlerini sağlayan hook.
 * 
 * @returns {Object} - { profile, loading, updateProfileData }
 */
export const useProfile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState({
        photoURL: '',
        bio: '',
        initialBio: '' // Değişiklik kontrolü için
    });
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Profil verilerini on-mount anında çek
    useEffect(() => {
        if (!user) {
            navigate("/");
            return;
        }

        const fetchProfile = async () => {
            setFetching(true);
            try {
                const docRef = doc(db, "admin", "profile");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setProfile({
                        photoURL: data.photoURL || '',
                        bio: data.bio || '',
                        initialBio: data.bio || ''
                    });
                } else {
                    // Firestore'da yoksa Auth verisini kullan
                    setProfile({
                        photoURL: user.photoURL || '',
                        bio: '',
                        initialBio: ''
                    });
                }
            } catch (error) {
                console.error("[useProfile] Profil yükleme hatası:", error);
                toast.error("Profil bilgileri yüklenemedi.");
            } finally {
                setFetching(false);
            }
        };

        fetchProfile();
    }, [user, navigate]);

    /**
     * Profil güncelleme işlemini başlatır.
     * 
     * @param {File|null} imageFile - Yeni seçilen fotoğraf dosyası (yoksa null)
     * @param {string} newBio - Yeni biyografi metni
     * @returns {Promise<boolean>} - İşlem başarılıysa true döner
     */
    const updateProfileData = async (imageFile, newBio) => {
        setLoading(true);
        try {
            let finalPhotoURL = profile.photoURL;

            // 1. Yeni resim varsa Storage'a yükle
            if (imageFile) {
                if (user) console.log(`[DEBUG] Uploading as UID: ${user.uid}`);
                const storageRef = ref(storage, `profile/admin_profile_${Date.now()}`);
                const snapshot = await uploadBytes(storageRef, imageFile);
                finalPhotoURL = await getDownloadURL(snapshot.ref);
            }

            // 2. Firebase Auth Profilini Güncelle (Fallback olarak)
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                    photoURL: finalPhotoURL
                });
            }

            // 3. Firestore "Source of Truth"u Güncelle
            const adminProfileRef = doc(db, "admin", "profile");
            await setDoc(adminProfileRef, {
                bio: newBio,
                photoURL: finalPhotoURL,
                updatedAt: new Date()
            }, { merge: true });

            // 4. AUTO-POST Mantığı (Otomatik Gönderi)
            // Eğer fotoğraf değiştiyse
            if (imageFile) {
                await insertDocument({
                    content: newBio,
                    images: [finalPhotoURL],
                    image_url: finalPhotoURL,
                    timestamp: new Date()
                });
            }
            // Sadece biyo değiştiyse
            else if (newBio !== profile.initialBio) {
                await insertDocument({
                    content: `Durum güncellemesi: \n\n"${newBio}" ✍️`,
                    images: [],
                    image_url: null,
                    timestamp: new Date()
                });
            }

            // State'i güncelle
            setProfile(prev => ({
                ...prev,
                photoURL: finalPhotoURL,
                bio: newBio,
                initialBio: newBio
            }));

            toast.success("Profil başarıyla güncellendi!");
            return true;

        } catch (error) {
            console.error("[useProfile] Güncelleme hatası:", error);
            toast.error("Hata: " + error.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        profile,
        loading,
        fetching,
        updateProfileData
    };
};
