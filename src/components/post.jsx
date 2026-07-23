/**
 * @file post.jsx
 * @description Tek bir gönderiyi (Post) görüntüleyen ana bileşen.
 * Başlık (Avatar/İsim), İçerik (Metin/Görsel) ve Alt Bilgi (Footer) alanlarından oluşur.
 * 
 * @dependencies
 * - src/components/post-images.jsx (Görsel Slider yönetimi)
 * - src/services/post-methods.js (Silme işlemi)
 * 
 * @date 2026-01-17
 * @author [AI Assistant]
 * 
 * @notes
 * - Görsel mantığı `PostImages` bileşenine devredilmiştir.
 * - Admin yetkisi kontrolü burada yapılır.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FiMoreVertical, FiEdit2, FiTrash2, FiLink, FiCopy, FiArchive } from 'react-icons/fi';
import { deleteDocument, updatePostStatus } from '../services/post-methods';
import { useAuth } from '../context/auth-context';
import PostImages from './post-images';
import { useProfileContext } from '../context/profile-context';

const Post = ({ post, onDelete, onUnarchive }) => {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { profile } = useProfileContext();

  const handleDelete = async () => {
    if (window.confirm("Bu gönderiyi silmek istediğinize emin misiniz?")) {
      const result = await deleteDocument(post.id);
      if (result.success) {
        if (onDelete) onDelete(post.id);
      } else {
        alert("Silme işlemi başarısız oldu.");
      }
    }
  };

  // Convert legacy/single image format to array
  const rawImages = post.images && Array.isArray(post.images) ? post.images : (post.image_url ? [post.image_url] : []);
  const hasImages = rawImages.length > 0;

  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group">

      {/* 1. Header Area */}
      <div className="px-4 py-3 flex justify-between items-start bg-slate-100/50 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden ring-2 ring-slate-50">
            <img
              src={profile.photoURL || null}
              alt={profile.displayName || undefined}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <h3 className="text-slate-800 font-bold text-sm font-['Ubuntu']">{profile.displayName}</h3>
            <div className="flex items-center gap-2 text-xs font-['Ubuntu']">
              <span className="text-slate-400">
                {post.timestamp?.seconds
                  ? new Date(post.timestamp.seconds * 1000).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
                  : 'Tarih yok'}
              </span>
            </div>
          </div>
        </div>

        {/* Menu Button (Only for Admin) */}
        {isAdmin && (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-slate-300 hover:text-slate-500 transition-colors">
              <FiMoreVertical size={20} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 bg-white border border-slate-100 shadow-lg rounded-lg py-1 w-32 z-20 animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={() => navigate('/create-post', { state: { postToEdit: post } })}
                  className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                >
                  <FiEdit2 size={14} /> Düzenle
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(post.content);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                >
                  <FiCopy size={14} /> Kopyala
                </button>
                <button
                  onClick={async () => {
                    if (onUnarchive) {
                      // Arşiv sayfasında: yayına al
                      onUnarchive(post.id);
                    } else {
                      // Normal sayfada: arşivle
                      if (window.confirm("Bu gönderiyi arşivlemek istediğinize emin misiniz? Ana sayfada görünmeyecek.")) {
                        const result = await updatePostStatus(post.id, ['archived']);
                        if (result.success) {
                          if (onDelete) onDelete(post.id);
                        } else {
                          alert("Arşivleme başarısız.");
                        }
                      }
                    }
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                >
                  <FiArchive size={14} /> {onUnarchive ? 'Yayına al' : 'Arşivle'}
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                >
                  <FiTrash2 size={14} /> Sil
                </button>
              </div>
            )}
            {/* Click outside overlay to close menu */}
            {showMenu && (
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
            )}
          </div>
        )}
      </div>

      {/* 2. Body Area (Content) */}
      <div className="bg-slate-50/30 min-h-[5rem]">

        {/* YouTube Embed — gizlilik dostu mod (nocookie) */}
        {post.youtube_id && (
          <div className="relative w-full overflow-hidden" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={`https://www.youtube-nocookie.com/embed/${post.youtube_id}`}
              title="YouTube video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          </div>
        )}

        {/* Görsel veya Metin */}
        {(hasImages || post.content) && (
          <div className="p-4">
            {hasImages ? (
              <PostImages images={rawImages} content={post.content} />
            ) : (
              <p className="text-slate-700 font-['Ubuntu'] text-lg leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            )}
          </div>
        )}

      </div>

      {/* 3. Footer Area (Visual Actions) */}
      <div className="bg-slate-100/50 px-4 py-3 flex justify-between items-center border-t border-slate-100 min-h-[3.5rem]">

        {/* Only Link Button Remains */}
        <button className="flex items-center gap-2 text-slate-400 hover:text-blue-500 transition-colors group" title="Bağlantı (Yakında)">
          <FiLink size={20} className="group-hover:scale-110 transition-transform" />
        </button>

        {post.category && (
          <button
            onClick={() => navigate(`/posts?category=${encodeURIComponent(post.category)}`)}
            className="bg-white text-slate-500 px-3 py-1 text-sm rounded-md border border-slate-200 font-medium shadow-sm hover:bg-slate-50 transition-colors"
          >
            {post.category}
          </button>
        )}

      </div>
    </div>
  );
};

Post.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    image_url: PropTypes.string,
    images: PropTypes.arrayOf(PropTypes.string),
    timestamp: PropTypes.shape({
      seconds: PropTypes.number,
      nanoseconds: PropTypes.number,
      toDate: PropTypes.func,
    }),
  }).isRequired,
  onDelete: PropTypes.func,
  onUnarchive: PropTypes.func,
};

export default Post;
