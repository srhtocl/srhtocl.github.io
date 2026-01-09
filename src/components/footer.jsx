import { NavLink } from "react-router-dom";
import { FiHome, FiEdit, FiMessageSquare, FiBook, FiClipboard } from "react-icons/fi";
import React from "react";
import { useAuth } from "../context/auth-context";
import Cookies from "js-cookie";

export const Footer = ({ user, isLoading }) => {
  const authContext = useAuth();

  return (
    <footer
      id="footer"
      className="flex justify-center bg-gray-100 border-t-2 00 fixed bottom-0 w-full"
    >
      <nav className="flex justify-evenly w-full">
        <NavLink to="/" className="navlink py-4 no-underline text-[#55575b] p-2 text-2xl">
          <FiHome className="react-fi-navlink" />
        </NavLink>

        {authContext.user && (
          <NavLink to="/posts" className="navlink py-4 no-underline text-[#55575b] p-2 text-2xl">
            <FiClipboard className="react-fi-navlink" />
          </NavLink>
        )}


        <NavLink
          to={authContext.user ? Cookies.get("user") ? `/response/${Cookies.get("user")}` : "/all-messages" : "/message"}
          className="navlink py-4 no-underline text-[#55575b] p-2 text-2xl" >
          <FiMessageSquare className="react-fi-navlink" />
        </NavLink>

        {authContext.user && (
          <NavLink className="navlink py-4 no-underline text-[#55575b] p-2 text-2xl" to="/all-messages">
            <FiBook className="react-fi-navlink" />
          </NavLink>
        )}

        {authContext.user && (
          <NavLink className="navlink py-4 no-underline text-[#55575b] p-2 text-2xl" to="/create-post">
            <FiEdit className="react-fi-navlink" />
          </NavLink>
        )}
      </nav>
    </footer>
  );
};
