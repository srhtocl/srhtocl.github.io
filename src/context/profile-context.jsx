/**
 * @file profile-context.jsx
 * @description Uygulama genelinde admin profil verisini yöneten Context.
 *
 * - Uygulama açılışında (mount) Firestore'dan profil verisini çeker.
 * - `updateProfileData` metoduyla profil güncellendiğinde hem Firestore'u
 *   hem de Context state'ini günceller → ikinci bir fetch'e gerek kalmaz.
 * - `refreshProfile` ile dışarıdan yeniden fetch tetiklenebilir.
 *
 * @date 2026-07-23 (refactor: duplikasyon giderildi)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { updateProfile as updateFirebaseAuthProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../services/firebase";
import { insertDocument } from "../services/post-methods";
import { toast } from "react-hot-toast";

const ProfileContext = createContext();

export const useProfileContext = () => {
    return useContext(ProfileContext);
};

export const ProfileProvider = ({ children }) => {
    const [profile, setProfile] = useState({
        photoURLs: [],
        bio: "",
        displayName: ""
    });
    const [profileLoading, setProfileLoading] = useState(true);

    // ── Firestore'dan profil verisini çek ─────────────────────────────────
    const fetchProfile = useCallback(async () => {
        setProfileLoading(true);
        try {
            const docRef = doc(db, "admin", "profile");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();

                // Geriye dönük uyumluluk:
                // Firestore'da eski "photoURL" (tekil) varsa diziyi ondan oluştur.
                // Yeni "photoURLs" (çoğul dizi) varsa onu kullan.
                let resolvedPhotoURLs = [];
                if (Array.isArray(data.photoURLs) && data.photoURLs.length > 0) {
                    resolvedPhotoURLs = data.photoURLs;
                } else if (data.photoURL) {
                    resolvedPhotoURLs = [data.photoURL];
                }

                setProfile({
                    photoURLs: resolvedPhotoURLs,
                    bio: data.bio || "",
                    displayName: data.displayName || ""
                });
            }
        } catch (error) {
            console.error("Profile verisi çekilemedi:", error);
        } finally {
            setProfileLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    /**
     * Profil güncelleme işlemini başlatır.
     * Storage upload → Firestore yazma → Auth profil güncelleme → Auto-post.
     *
     * @param {object} params
     * @param {File[]}   params.newFiles          - Yeni yüklenecek dosyalar
     * @param {string[]} params.orderedPhotoURLs  - Kullanıcının sıraladığı nihai URL listesi
     * @param {string}   params.newBio            - Yeni biyografi
     * @returns {Promise<boolean>}
     */
    const updateProfileData = useCallback(async ({ newFiles = [], orderedPhotoURLs = [], newBio }) => {
        try {
            // 1. Yeni dosyaları Storage'a yükle; blob: URL'lerini gerçek URL'lerle değiştir
            const uploadedMap = new Map(); // blob URL → download URL
            for (const file of newFiles) {
                const blobUrl = URL.createObjectURL(file);
                const storageRef = ref(storage, `profile/admin_profile_${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                uploadedMap.set(blobUrl, downloadURL);
            }

            // 2. orderedPhotoURLs içindeki blob: URL'lerini gerçek URL'lerle değiştir
            const finalPhotoURLs = orderedPhotoURLs.map(url =>
                uploadedMap.has(url) ? uploadedMap.get(url) : url
            );

            const coverPhotoURL = finalPhotoURLs[0] || '';
            const hadNewFiles = newFiles.length > 0;
            const bioChanged = newBio !== profile.bio;

            // 3. Firebase Auth profilini güncelle (kapak fotoğrafı)
            if (auth.currentUser && coverPhotoURL) {
                await updateFirebaseAuthProfile(auth.currentUser, { photoURL: coverPhotoURL });
            }

            // 4. Firestore "Source of Truth"u güncelle
            const adminProfileRef = doc(db, "admin", "profile");
            await setDoc(adminProfileRef, {
                photoURLs: finalPhotoURLs,
                photoURL: coverPhotoURL,  // geriye dönük uyumluluk
                bio: newBio,
                updatedAt: new Date()
            }, { merge: true });

            // 5. AUTO-POST Mantığı
            if (hadNewFiles) {
                const postResult = await insertDocument({
                    content: newBio,
                    images: [coverPhotoURL],
                    image_url: coverPhotoURL,
                    timestamp: new Date()
                });
                if (!postResult.success) console.warn("[ProfileContext] Auto-post oluşturulamadı:", postResult.error);
            } else if (bioChanged) {
                const postResult = await insertDocument({
                    content: `Durum güncellemesi: \n\n"${newBio}" ✍️`,
                    images: [],
                    image_url: null,
                    timestamp: new Date()
                });
                if (!postResult.success) console.warn("[ProfileContext] Auto-post oluşturulamadı:", postResult.error);
            }

            // 6. Context state'ini LOCAL olarak güncelle (yeniden fetch gerektirmez)
            setProfile(prev => ({
                ...prev,
                photoURLs: finalPhotoURLs,
                bio: newBio
            }));

            toast.success("Profil başarıyla güncellendi!");
            return true;

        } catch (error) {
            console.error("[ProfileContext] Güncelleme hatası:", error);
            toast.error("Hata: " + error.message);
            return false;
        }
    }, [profile.bio]);

    return (
        <ProfileContext.Provider value={{
            profile,
            profileLoading,
            updateProfileData,
            refreshProfile: fetchProfile  // Dışarıdan yeniden fetch tetiklemek için
        }}>
            {children}
        </ProfileContext.Provider>
    );
};
