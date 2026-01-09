import React from "react";
import { Link } from "react-router-dom";

export default function Home() {

    return (

        <section className="relative flex flex-col w-full h-full justify-center items-center overflow-hidden bg-gradient-to-br from-slate-50 via-gray-100 to-slate-200">

            {/* Background Atmosphere - Subtle & Professional */}
            <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-slate-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob"></div>
            <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-gray-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-[20%] left-[20%] w-[70vw] h-[70vw] bg-slate-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-30 animate-blob animation-delay-4000"></div>

            {/* Main Content Container - Centered Z-Index High */}
            <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center max-w-4xl">

                {/* Profile Section - Clickable for Messages */}
                <div className="mb-10 relative group">
                    {/* Glowing effect behind image */}
                    <div className="absolute -inset-4 bg-white/50 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition duration-700"></div>

                    <Link to="/message" className="relative block w-40 h-40 md:w-56 md:h-56 p-1 border-4 border-white/50 rounded-full shadow-2xl transform transition-transform duration-500 group-hover:scale-105" aria-label="Bana Anonim Mesaj Gönder">
                        <img
                            className="w-full h-full rounded-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                            src="https://pbs.twimg.com/profile_images/1483105275766882304/4CYpr2hO_400x400.jpg"
                            alt="Serhat öcal"
                        />
                    </Link>
                </div>

                {/* Typography Section */}
                <div className="space-y-6">
                    <p className="text-2xl md:text-3xl text-slate-700 font-['Marck_Script'] tracking-wide max-w-2xl mx-auto leading-relaxed drop-shadow-sm select-none">
                        bir-iki kelime bile sessizlikten iyidir.
                    </p>
                </div>

            </div>

        </section>
    )
}