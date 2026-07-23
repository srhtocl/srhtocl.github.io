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
import { auth, db } from "../services/firebase";
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

    const fetchProfile = useCallback(async () => {
        setProfileLoading(true);
        try {
            const docRef = doc(db, "admin", "profile");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();

                // Geriye dönük uyumluluk:
                let resolvedPhotoURLs = [];
                if (Array.isArray(data.photoURLs) && data.photoURLs.length > 0) {
                    resolvedPhotoURLs = data.photoURLs;
                } else if (data.photoURL) {
                    resolvedPhotoURLs = [data.photoURL];
                }

                setProfile({
                    photoURLs: resolvedPhotoURLs,
                    bio: data.bio || "",
                    displayName: data.displayName || data.name || "", // We will merge auth user later if needed
                    username: data.username || ""
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

    // Google Auth verisi (user) gecikmeli gelebileceği için, eğer veritabanında isim yoksa 
    // ve auth.currentUser sonradan yüklenirse ismi Google'dan al.
    useEffect(() => {
        if (auth.currentUser?.displayName && !profile.displayName) {
            setProfile(prev => ({
                ...prev,
                displayName: prev.displayName || auth.currentUser.displayName
            }));
        }
    }, [profile.displayName]); // We check whenever profile changes, and if it's empty, we try auth.currentUser. But better yet, let's just listen to auth state changes in useAuth.


    /**
     * Profil güncelleme işlemini başlatır.
     * Storage upload → Firestore yazma → Auth profil güncelleme → Auto-post.
     *
     * @param {object} params
     * @param {string[]} params.orderedPhotoURLs  - Kullanıcının sıraladığı nihai URL listesi
     * @param {string}   params.newBio            - Yeni biyografi
     * @param {string}   params.newDisplayName    - Yeni ad soyad
     * @param {string}   params.newUsername       - Yeni kullanıcı adı
     * @returns {Promise<boolean>}
     */
    const updateProfileData = useCallback(async ({ orderedPhotoURLs = [], newBio, newDisplayName, newUsername }) => {
        try {
            const finalPhotoURLs = orderedPhotoURLs;
            const coverPhotoURL = finalPhotoURLs[0] || '';
            const coverPhotoChanged = profile.photoURLs[0] !== coverPhotoURL;
            const bioChanged = newBio !== profile.bio;

            // 3. Firebase Auth profilini güncelle (kapak fotoğrafı)
            if (auth.currentUser && coverPhotoURL && coverPhotoChanged) {
                await updateFirebaseAuthProfile(auth.currentUser, { photoURL: coverPhotoURL });
            }

            // 4. Firestore "Source of Truth"u güncelle
            const adminProfileRef = doc(db, "admin", "profile");
            await setDoc(adminProfileRef, {
                photoURLs: finalPhotoURLs,
                photoURL: coverPhotoURL,  // geriye dönük uyumluluk
                bio: newBio,
                displayName: newDisplayName !== undefined ? newDisplayName : profile.displayName,
                username: newUsername !== undefined ? newUsername : profile.username,
                updatedAt: new Date()
            }, { merge: true });

            // 5. AUTO-POST Mantığı
            if (coverPhotoChanged && coverPhotoURL) {
                const postResult = await insertDocument({
                    content: newBio || "Yeni profil fotoğrafım!",
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
                bio: newBio !== undefined ? newBio : prev.bio,
                displayName: newDisplayName !== undefined ? newDisplayName : prev.displayName,
                username: newUsername !== undefined ? newUsername : prev.username
            }));

            toast.success("Profil başarıyla güncellendi!");
            return true;

        } catch (error) {
            console.error("[ProfileContext] Güncelleme hatası:", error);
            toast.error("Hata: " + error.message);
            return false;
        }
    }, [profile.bio, profile.photoURLs]);

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
