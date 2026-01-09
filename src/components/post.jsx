import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FiMoreVertical, FiEdit2, FiTrash2, FiImage, FiLink } from 'react-icons/fi';
import { deleteDocument } from '../services/post-methods';

const Post = ({ post, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (window.confirm("Bu gönderiyi silmek istediğinize emin misiniz?")) {
      const result = await deleteDocument(post.id);
      if (result === null) { // deleteDocument returns null on success based on our service
        if (onDelete) onDelete(post.id);
      } else {
        alert("Silme işlemi başarısız oldu.");
      }
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden relative">

      {/* 1. Header Area */}
      <div className="bg-slate-100/50 px-4 py-3 flex justify-between items-center border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden p-0.5 border border-slate-200">
            <img
              src="https://pbs.twimg.com/profile_images/1483105275766882304/4CYpr2hO_400x400.jpg"
              alt="Serhat Öcal"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-slate-700 font-bold text-sm font-['Ubuntu']">serhat öcal</span>
            <span className="text-slate-400 text-xs">
              {(() => {
                const rawDate = post.timestamp;
                const date = rawDate?.toDate ? rawDate.toDate() : new Date(rawDate || Date.now());
                return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
              })()}
            </span>
          </div>
        </div>

        {/* Menu Button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors"
          >
            <FiMoreVertical size={20} />
          </button>

          {/* ... Menu Dropdown ... */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-36 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20 overflow-hidden animate-in fade-in zoom-in duration-200">
              <button
                onClick={() => navigate('/create-post', { state: { postToEdit: post } })}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
              >
                <FiEdit2 size={14} />
                <span>Düzenle</span>
              </button>
              <button
                onClick={handleDelete}
                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <FiTrash2 size={14} />
                <span>Sil</span>
              </button>
            </div>
          )}

          {/* Click outside overlay to close menu */}
          {showMenu && (
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
          )}
        </div>
      </div>

      {/* 2. Body Area (Content) */}
      <div className="p-4 bg-slate-50/30 min-h-[5rem]">
        <p className="text-slate-700 font-['Ubuntu'] text-lg leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {/* 3. Footer Area (Visual Actions) */}
      <div className="bg-slate-100/50 px-4 py-3 flex items-center gap-4 border-t border-slate-100">
        <button className="flex items-center gap-2 text-slate-400 hover:text-blue-500 transition-colors group" title="Görsel (Yakında)">
          <FiImage size={20} className="group-hover:scale-110 transition-transform" />
        </button>
        <button className="flex items-center gap-2 text-slate-400 hover:text-blue-500 transition-colors group" title="Bağlantı (Yakında)">
          <FiLink size={20} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>

    </div>
  );
};

export default Post;
