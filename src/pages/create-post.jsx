import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/auth-context';
import { useNavigate, useLocation } from 'react-router';
import { insertDocument, updateDocument } from '../services/post-methods';
import { FiSend, FiImage, FiX } from "react-icons/fi";
import { storage } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const CreatePost = () => {
  const [content, setContent] = useState('');
  const [existingImages, setExistingImages] = useState([]); // URLs from DB
  const [newFiles, setNewFiles] = useState([]); // File objects to upload
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const authContext = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const editMode = location.state?.postToEdit;

  useEffect(() => {
    if (!authContext.user) { navigate("/"); }
    if (editMode) {
      setContent(editMode.content);
      // Backward compatibility: If 'images' array exists use it, else if 'image_url' string exists use it.
      if (editMode.images && Array.isArray(editMode.images)) {
        setExistingImages(editMode.images);
      } else if (editMode.image_url) {
        setExistingImages([editMode.image_url]);
      }
    }
  }, [editMode]);

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setNewFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeNewFile = (indexToRemove) => {
    setNewFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    // Reset input value to allow re-selecting the same file if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeExistingImage = (urlToRemove) => {
    setExistingImages(prev => prev.filter(url => url !== urlToRemove));
  };

  const handleSave = async () => {
    if (!content.trim() && existingImages.length === 0 && newFiles.length === 0) return;
    if (!content.trim()) return; // Optional: Enforce text content? Currently yes.

    setUploading(true);
    let finalImageUrls = [...existingImages];

    try {
      // 1. Upload New Files
      if (newFiles.length > 0) {
        const uploadPromises = newFiles.map(async (file) => {
          const storageRef = ref(storage, `posts/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          return getDownloadURL(snapshot.ref);
        });
        const uploadedUrls = await Promise.all(uploadPromises);
        finalImageUrls = [...finalImageUrls, ...uploadedUrls];
      }

      const postData = {
        content,
        images: finalImageUrls,
        image_url: finalImageUrls.length > 0 ? finalImageUrls[0] : null, // Backward compatibility for single image view
        updated_at: new Date(),
      };

      if (editMode) {
        await updateDocument(editMode.id, postData);
      } else {
        postData.timestamp = new Date();
        await insertDocument(postData);
      }

      setContent('');
      setNewFiles([]);
      setExistingImages([]);
      navigate('/posts');

    } catch (error) {
      console.error("Post save error:", error);
      alert("Gönderi paylaşılırken bir hata oluştu: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative flex flex-col w-full h-[100dvh] overflow-hidden bg-slate-50 items-center pt-24">

      {/* Background Atmosphere */}
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
              disabled={uploading}
            />

            {/* Image Preview Strip (Max Height 56px) */}
            {(existingImages.length > 0 || newFiles.length > 0) && (
              <div className="mt-2 flex items-center gap-2 overflow-x-auto h-[56px] py-1 px-1 scrollbar-hide">

                {/* Existing Images */}
                {existingImages.map((url, index) => (
                  <div key={`existing-${index}`} className="relative flex-shrink-0 w-10 h-10 rounded-md overflow-hidden group border border-slate-200">
                    <img src={url} alt="existing" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeExistingImage(url)}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ))}

                {/* New Files */}
                {newFiles.map((file, index) => (
                  <div key={`new-${index}`} className="relative flex-shrink-0 w-10 h-10 rounded-md overflow-hidden group border border-blue-200 ring-1 ring-blue-100">
                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" onLoad={(e) => URL.revokeObjectURL(e.target.src)} />
                    <button
                      onClick={() => removeNewFile(index)}
                      className="absolute inset-0 bg-blue-500/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="hidden"
            />
          </div>

          {/* 3. Footer Area (Actions) */}
          <div className="bg-slate-100/50 px-4 py-3 flex justify-between items-center border-t border-slate-100">
            <button
              onClick={handleImageClick}
              className={`transition-colors p-2 rounded-full hover:bg-slate-200/50 ${newFiles.length > 0 || existingImages.length > 0 ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`}
              title="Resim Ekle"
              disabled={uploading}
            >
              <FiImage size={24} />
            </button>

            <button
              onClick={handleSave}
              disabled={(!content.trim() && existingImages.length === 0 && newFiles.length === 0) || uploading}
              className={`transform transition-all duration-200 ${content.trim() || existingImages.length > 0 || newFiles.length > 0 ? 'text-blue-600 hover:scale-110' : 'text-slate-300'}`}
            >
              <FiSend size={24} className={uploading ? "animate-pulse" : ""} />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};


export default CreatePost;
