/**
 * @file home.jsx
 * @description Kişisel ana sayfa. Profil slider, biyografi ve mesaj sayfasına yönlendirme içerir.
 *
 * @dependencies
 * - src/context/profile-context (profil verisi)
 * - src/components/profile-slider (katmanlı profil fotoğrafı slider'ı)
 *
 * @date 2026-07-20
 */

import React from "react";
import { Link } from "react-router-dom";
import { FiMessageSquare } from "react-icons/fi";
import { useProfileContext } from "../context/profile-context";
import { useAuth } from "../context/auth-context";
import ProfileSlider from "../components/profile-slider";

export default function Home() {
    const { profile } = useProfileContext();
    const { user } = useAuth();

    return (
        <section className="relative flex flex-col w-full h-full justify-center items-center overflow-hidden bg-gradient-to-br from-slate-50 via-gray-100 to-slate-200">

            {/* Background Atmosphere */}
            <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-slate-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob" />
            <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-gray-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob animation-delay-2000" />
            <div className="absolute -bottom-[20%] left-[20%] w-[70vw] h-[70vw] bg-slate-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-30 animate-blob animation-delay-4000" />

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center max-w-4xl w-full">

                {/* Profile Slider */}
                {profile.photoURLs?.length > 0 && (
                    <div className="mb-12 w-full max-w-xs md:max-w-md">
                        <ProfileSlider images={profile.photoURLs} />
                    </div>
                )}

                {/* Typography Section */}
                {profile.bio && (
                    <div className="space-y-6">
                        <p className="text-2xl md:text-3xl text-slate-700 font-['Marck_Script'] tracking-wide max-w-2xl mx-auto leading-relaxed drop-shadow-sm select-none">
                            {profile.bio}
                        </p>
                    </div>
                )}

            </div>

            {/* FAB — sadece giriş yapılmamışsa göster */}
            {!user && (
                <div className="fixed bottom-0 left-0 w-full z-30 p-4 pointer-events-none">
                    <div className="w-full max-w-2xl mx-auto flex justify-end pointer-events-none">
                        <div className="p-2 pointer-events-auto">
                            <Link
                                to="/message"
                                className="flex items-center justify-center w-12 h-12 bg-white text-slate-800 border border-slate-200 rounded-xl shadow-md hover:bg-slate-50 transition-all active:scale-95"
                                aria-label="Mesaj Gönder"
                            >
                                <FiMessageSquare size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

        </section>
    );
}