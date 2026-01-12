import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/auth-context';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { toast } from "react-hot-toast";

const EditProfile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [photoURL, setPhotoURL] = useState('');
    const [bio, setBio] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setPhotoURL(user.photoURL || '');
        } else {
            navigate("/");
        }
    }, [user, navigate]);

    const handleSave = async () => {
        setLoading(true);
        try {
            // 1. Update Auth Profile (Photo only)
            await updateProfile(auth.currentUser, {
                photoURL: photoURL
            });

            // 2. Update Firestore Profile (Bio & Photo)
            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, {
                bio: bio,
                photoURL: photoURL,
                updatedAt: new Date()
            }, { merge: true });

            toast.success("Profil güncellendi.");
            setTimeout(() => navigate(0), 1000);

        } catch (error) {
            console.error("Hata:", error);
            toast.error("Bir hata oluştu: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col font-['Ubuntu'] bg-slate-50">

            {/* Content Container */}
            <div className="flex-1 w-full max-w-2xl mx-auto p-6 space-y-8">

                {/* Form Section */}
                <div className="space-y-6 pt-8">

                    {/* Bio / Quote Input */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Biyografi / Söz</label>
                        <div className="relative">
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Bir-iki kelime bile sessizlikten iyidir..."
                                className="w-full bg-white border border-slate-200 rounded-xl py-4 px-4 text-slate-800 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all font-medium placeholder:text-slate-300 shadow-sm min-h-[120px] resize-y font-['Marck_Script'] text-xl"
                            />
                        </div>
                    </div>

                    {/* Photo URL Input */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Profil Fotoğrafı URL</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={photoURL}
                                onChange={(e) => setPhotoURL(e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-white border border-slate-200 rounded-xl py-4 px-4 text-slate-800 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all font-medium placeholder:text-slate-300 shadow-sm"
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
