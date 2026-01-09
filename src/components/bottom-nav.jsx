import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiEdit, FiSearch, FiMessageSquare } from 'react-icons/fi';
import { useAuth } from '../context/auth-context';

const BottomNav = () => {
    const authContext = useAuth();

    // Only show if user is logged in
    if (!authContext.user) return null;

    const navItemClass = ({ isActive }) =>
        `flex flex-col items-center justify-center w-full h-full text-2xl transition-all duration-300 ${isActive ? 'text-slate-800 scale-110' : 'text-slate-400 hover:text-slate-500'}`;

    return (
        <div className="fixed bottom-0 left-0 w-full h-16 bg-white/90 backdrop-blur-md border-t border-white/50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 flex justify-around items-center px-2">

            <NavLink to="/posts" className={navItemClass}>
                <FiHome size={24} />
            </NavLink>

            <NavLink to="/create-post" className={navItemClass}>
                <FiEdit size={24} />
            </NavLink>

            <NavLink to="/all-messages" className={navItemClass}>
                <FiMessageSquare size={24} />
            </NavLink>

        </div>
    );
};

export default BottomNav;
