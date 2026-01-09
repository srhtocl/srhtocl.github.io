import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/auth-context';
import { useNavigate, useLocation } from 'react-router';
import { insertDocument, updateDocument } from '../services/post-methods';
import { FiSend, FiImage } from "react-icons/fi";

const CreatePost = () => {
  const [content, setContent] = useState('');
  const authContext = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const editMode = location.state?.postToEdit;

  useEffect(() => {
    if (!authContext.user) { navigate("/"); }
    if (editMode) {
      setContent(editMode.content);
    }
  }, [editMode]);

  const handleSave = async () => {
    if (!content.trim()) return;

    if (editMode) {
      // Update existing post
      await updateDocument(editMode.id, {
        content,
        updated_at: new Date(),
      });
    } else {
      // Create new post
      const newPost = {
        content,
        image_url: null,
        timestamp: new Date(),
        updated_at: new Date(),
      };
      await insertDocument(newPost);
    }

    setContent('');
    navigate('/posts');
  };

  return (
    <div className="relative flex flex-col w-full h-[100dvh] overflow-hidden bg-slate-50 items-center pt-24">

      {/* Background Atmosphere (Kept subtle) */}
      <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-slate-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 pointer-events-none"></div>

      {/* Social Editor Card */}
      <div className="relative z-20 w-full max-w-lg px-4">

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">

          {/* 1. Header Area */}
          <div className="bg-slate-100/50 px-4 py-3 flex items-center gap-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
              <img
                src="https://pbs.twimg.com/profile_images/1483105275766882304/4CYpr2hO_400x400.jpg"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-slate-700 font-bold text-sm font-['Ubuntu']">Serhat Öcal</span>
              <span className="text-slate-400 text-xs">{new Date().toLocaleDateString('tr-TR')}</span>
            </div>
          </div>

          {/* 2. Body Area (Input) */}
          <div className="p-4 bg-slate-50/30">
            <textarea
              placeholder="Ne düşünüyorsun?"
              className="w-full h-32 bg-transparent border-none text-slate-700 placeholder-slate-400 outline-none resize-none font-['Ubuntu'] text-lg"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* 3. Footer Area (Actions) */}
          <div className="bg-slate-100/50 px-4 py-3 flex justify-between items-center border-t border-slate-100">
            <button className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-200/50">
              <FiImage size={24} />
            </button>

            <button
              onClick={handleSave}
              disabled={!content.trim()}
              className={`transform transition-all duration-200 ${content.trim() ? 'text-blue-600 hover:scale-110' : 'text-slate-300'}`}
            >
              <FiSend size={24} />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

export default CreatePost;
