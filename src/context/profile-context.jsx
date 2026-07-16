import React, { createContext, useContext, useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";

const ProfileContext = createContext();

export const useProfileContext = () => {
    return useContext(ProfileContext);
};

export const ProfileProvider = ({ children }) => {
    const [profile, setProfile] = useState({
        photoURL: "",
        bio: "",
        displayName: ""
    });
    const [profileLoading, setProfileLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const docRef = doc(db, "admin", "profile");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setProfile({
                        photoURL: data.photoURL || "",
                        bio: data.bio || "",
                        displayName: data.displayName || ""
                    });
                }
            } catch (error) {
                console.error("Profile verisi çekilemedi:", error);
            } finally {
                setProfileLoading(false);
            }
        };
        fetchProfile();
    }, []);

    return (
        <ProfileContext.Provider value={{ profile, profileLoading }}>
            {children}
        </ProfileContext.Provider>
    );
};
