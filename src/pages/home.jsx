/**
 * @file home.jsx
 * @description Kişisel ana sayfa. Profil resmi, biyografi ve mesaj sayfasına yönlendirme içerir.
 * Profil resmi için Lightbox (Tam ekran) ve mesaj için FAB (Floating Action Button) özellikleri vardır.
 * 
 * @dependencies
 * - src/services/firebase (Firestore profil verisi)
 * - react-icons/fi (İkonlar)
 * 
 * @date 2026-01-18
 * @author [AI Assistant]
 */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { FiSend, FiX } from "react-icons/fi";

export default function Home() {
    const [profile, setProfile] = useState({
        photoURL: "https://pbs.twimg.com/profile_images/1483105275766882304/4CYpr2hO_400x400.jpg",
        bio: "bir-iki kelime bile sessizlikten iyidir."
    });
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const docRef = doc(db, "admin", "profile");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setProfile({
                        photoURL: docSnap.data().photoURL || profile.photoURL,
                        bio: docSnap.data().bio || profile.bio
                    });
                }
            } catch (error) {
                console.error("Profil verisi çekilemedi:", error);
            }
        };
        fetchProfile();
    }, []);

    return (
        <section className="relative flex flex-col w-full h-full justify-center items-center overflow-hidden bg-gradient-to-br from-slate-50 via-gray-100 to-slate-200">

            {/* Background Atmosphere */}
            <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-slate-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob"></div>
            <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-gray-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-[20%] left-[20%] w-[70vw] h-[70vw] bg-slate-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-30 animate-blob animation-delay-4000"></div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center max-w-4xl">

                {/* Profile Section - Clickable for Lightbox */}
                <div className="mb-10 relative group cursor-pointer" onClick={() => setIsLightboxOpen(true)}>
                    {/* Glowing effect */}
                    <div className="absolute -inset-4 bg-white/50 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition duration-700"></div>

                    <div className="relative w-40 h-40 md:w-56 md:h-56 p-1 border-4 border-white/50 rounded-full shadow-2xl transform transition-transform duration-500 group-hover:scale-105">
                        <img
                            className="w-full h-full rounded-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                            src={profile.photoURL}
                            alt="Serhat Öcal"
                        />
                    </div>
                </div>

                {/* Typography Section */}
                <div className="space-y-6">
                    <p className="text-2xl md:text-3xl text-slate-700 font-['Marck_Script'] tracking-wide max-w-2xl mx-auto leading-relaxed drop-shadow-sm select-none">
                        {profile.bio}
                    </p>
                </div>

            </div>

            {/* Floating Action Button (FAB) for Messages */}
            {/* FAB for Messages - Positioned EXACTLY matching Message Page Button Coordinate */}
            <div className="fixed bottom-0 left-0 w-full z-30 p-4 pointer-events-none">
                <div className="w-full max-w-2xl mx-auto flex justify-end pointer-events-none">
                    <div className="p-2 pointer-events-auto">
                        <Link
                            to="/message"
                            className="flex items-center justify-center w-12 h-12 bg-white text-slate-800 border border-slate-200 rounded-xl shadow-md hover:bg-slate-50 transition-all active:scale-95"
                            aria-label="Mesaj Gönder"
                        >
                            <FiSend size={20} className="translate-x-0.5" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Lightbox Modal */}
            {/* Lightbox Modal - Full Immersive */}
            {isLightboxOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-500"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <button
                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all z-50 hover:rotate-90 duration-300"
                        onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
                    >
                        <FiX size={32} />
                    </button>

                    <img
                        src={profile.photoURL}
                        alt="Profile Full"
                        className="w-screen h-screen object-contain animate-in zoom-in-50 slide-in-from-bottom-10 duration-500 ease-out select-none"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

        </section>
    )
}