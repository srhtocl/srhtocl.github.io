import React, { useState } from "react";
import { NavLink, useNavigate, useLocation, useMatches } from "react-router-dom";
import { FiMenu, FiChevronLeft, FiLogOut, FiUser, FiEdit3, FiUsers } from "react-icons/fi";
import { useAuth } from "../context/auth-context";

export const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const authContext = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const matches = useMatches();

    // Only show header if user is logged in
    if (!authContext.user) return null;

    const handleLogout = () => {
        setIsMenuOpen(false);
        authContext.handleLogout();
        navigate("/");
    };

    // Get title from the current route handle (the last matching route with a handle)
    const currentTitle = matches
        .filter((match) => Boolean(match.handle?.title))
        .map((match) => match.handle.title)
        .pop() || "srhtocl";

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const MenuItem = ({ icon: Icon, label, onClick, isRed }) => (
        <button
            onClick={onClick}
            className={`w-full text-left px-6 py-4 flex items-center gap-4 text-lg font-['Ubuntu'] transition-colors border-b border-gray-50 last:border-0 ${isRed ? 'text-red-500 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'}`}
        >
            <Icon size={20} />
            <span className="font-medium">{label}</span>
        </button>
    );

    return (
        <>
            {/* Top Header Bar */}
            <header className="fixed top-0 left-0 w-full h-16 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm flex items-center px-4 justify-between">

                {/* Left: Back Button */}
                <div className="w-10">
                    {location.pathname !== "/" && (
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <FiChevronLeft size={28} />
                        </button>
                    )}
                </div>

                {/* Center: Title */}
                <div className="flex-1 text-center">
                    <h1 className="text-lg font-bold text-slate-800 font-['Ubuntu'] truncate px-2">
                        {currentTitle}
                    </h1>
                </div>

                {/* Right: Menu Button */}
                <div className="w-10 flex justify-end">
                    <button
                        onClick={toggleMenu}
                        className="p-2 text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <FiMenu size={28} />
                    </button>
                </div>

            </header>

            {/* Bottom Sheet Overlay */}
            <div className={`fixed inset-0 z-[45] flex flex-col justify-end transition-all duration-300 ${isMenuOpen ? 'visible' : 'invisible pointer-events-none'}`}>

                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setIsMenuOpen(false)}
                ></div>

                {/* Sheet Content */}
                <div className={`relative bg-white/90 backdrop-blur-xl rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] w-full max-w-md mx-auto transform transition-transform duration-300 ease-out ${isMenuOpen ? 'translate-y-0' : 'translate-y-full'}`}>

                    {/* Handle Bar */}
                    <div className="w-full flex justify-center pt-3 pb-4">
                        <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
                    </div>

                    <div className="py-2 pb-24 px-6 pt-6">
                        <MenuItem icon={FiUser} label="Profile git" onClick={() => { setIsMenuOpen(false); navigate("/"); }} />
                        <MenuItem icon={FiEdit3} label="Profili Düzenle" onClick={() => { setIsMenuOpen(false); navigate("/edit-profile"); }} />
                        <MenuItem icon={FiLogOut} label="Çıkış Yap" onClick={handleLogout} isRed />
                    </div>

                </div>

            </div>
        </>
    );
};