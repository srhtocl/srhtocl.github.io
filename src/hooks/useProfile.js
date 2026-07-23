/**
 * @file useProfile.js
 * @description Profil düzenleme sayfası için UI state'ini yöneten Custom Hook.
 *
 * İş mantığı (fetch, upload, Firestore yazma) ProfileContext'e taşındı.
 * Bu hook yalnızca şunları sağlar:
 *  - ProfileContext'ten profil verisini okuma
 *  - loading state'ini sarma (kaydet butonu için)
 *  - updateProfileData proxy'si
 *
 * @date 2026-07-23 (refactor: duplikasyon giderildi, context'e taşındı)
 * @module Hooks
 */

import { useState } from 'react';
import { useProfileContext } from '../context/profile-context';

/**
 * Profil düzenleme hook'u.
 * Veriyi ProfileContext'ten okur, ikinci bir Firestore fetch yapmaz.
 *
 * @returns {{ profile, loading, fetching, updateProfileData }}
 */
export const useProfile = () => {
    const { profile, profileLoading, updateProfileData: contextUpdate } = useProfileContext();
    const [loading, setLoading] = useState(false);

    /**
     * Kaydet butonunun loading state'ini yöneterek Context'teki
     * updateProfileData'yı çağırır.
     *
     * @param {object} params - { newFiles, orderedPhotoURLs, newBio }
     * @returns {Promise<boolean>}
     */
    const updateProfileData = async (params) => {
        setLoading(true);
        try {
            return await contextUpdate(params);
        } finally {
            setLoading(false);
        }
    };

    return {
        profile,
        loading,
        fetching: profileLoading,   // edit-profile.jsx'in beklediği isim korundu
        updateProfileData
    };
};
