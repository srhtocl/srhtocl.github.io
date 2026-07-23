import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/auth-context';
import { useNavigate, useLocation } from 'react-router';
import { insertDocument, updateDocument } from '../services/post-methods';
import { useProfileContext } from '../context/profile-context';
import { getAllCategories, ensureCategoryExists } from '../services/category-methods';
import { FiSend, FiImage, FiX } from "react-icons/fi";
import { FaYoutube } from "react-icons/fa";
import { storage } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const CreatePost = () => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [availableCategories, setAvailableCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]); // Filtered list for UI
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [existingImages, setExistingImages] = useState([]); // URLs from DB
  const [newFiles, setNewFiles] = useState([]); // File objects to upload
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // YouTube
  const [youtubeId, setYoutubeId] = useState('');
  const [youtubeDraft, setYoutubeDraft] = useState('');
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);

  const authContext = useAuth();
  const { profile } = useProfileContext();
  const navigate = useNavigate();
  const location = useLocation();
  const editMode = location.state?.postToEdit;

  useEffect(() => {
    // 1. Verify Authentication & Log UID
    if (!authContext.user) {
      navigate("/");
      return;
    }

    // 2. Fetch categories (only if authenticated)
    (async () => {
      try {
        const cats = await getAllCategories();
        setAvailableCategories(cats || []);
      } catch (err) {
        console.error("Failed to load categories in component:", err);
      }
    })();

    if (editMode) {
      setContent(editMode.content);
      setCategory(editMode.category || '');
      if (editMode.youtube_id) setYoutubeId(editMode.youtube_id);
      // Backward compatibility: If 'images' array exists use it, else if 'image_url' string exists use it.
      if (editMode.images && Array.isArray(editMode.images)) {
        setExistingImages(editMode.images);
      } else if (editMode.image_url) {
        setExistingImages([editMode.image_url]);
      }
    } else if (location.state?.reshareImageUrl) {
      // Handle gallery reshare logic
      setExistingImages([location.state.reshareImageUrl]);
    }

    // Close suggestions on outside click
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editMode, authContext.user]);

  // Filter categories when input changes
  useEffect(() => {
    if (category) {
      const filtered = availableCategories.filter(cat =>
        cat.name.toLowerCase().startsWith(category.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(availableCategories);
    }
  }, [category, availableCategories]);

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

  // YouTube URL'inden 11 karakterlik video ID'sini çıkarır
  const parseYoutubeId = (url) => {
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  };

  // URL girdisini dinler; geçerli bir YouTube linki yapıştırılınca ID'yi otomatik yakalar
  const handleYoutubeInput = (e) => {
    const val = e.target.value;
    setYoutubeDraft(val);
    const id = parseYoutubeId(val);
    if (id) {
      setYoutubeId(id);
      setShowYoutubeInput(false);
      setYoutubeDraft('');
    }
  };

  const handleSave = async () => {
    if (!content.trim() && existingImages.length === 0 && newFiles.length === 0 && !youtubeId) return;

    setUploading(true);
    let finalImageUrls = [...existingImages];

    try {
      // 0. Ensure Category Exists
      if (category && category.trim()) {
        await ensureCategoryExists(category.trim());
      }

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
        youtube_id: youtubeId || '',
        category: category.trim(),
        updated_at: new Date(),
      };

      if (editMode) {
        const result = await updateDocument(editMode.id, postData);
        if (!result.success) throw new Error(result.error?.message || "Güncelleme başarısız");
      } else {
        postData.timestamp = new Date();
        postData.status = ['published']; // Default status as Array
        const result = await insertDocument(postData);
        if (!result.success) throw new Error(result.error?.message || "Ekleme başarısız");
      }

      setContent('');
      setCategory('');
      setNewFiles([]);
      setExistingImages([]);
      setYoutubeId('');
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
          <div className="bg-slate-100/50 px-4 h-14 flex items-center gap-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
              <img
                src={(profile?.photoURLs && profile.photoURLs.length > 0) ? profile.photoURLs[0] : null}
                alt={profile?.displayName || undefined}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-slate-700 font-bold text-sm leading-tight font-['Ubuntu']">{profile.displayName}</span>
              <span className="text-slate-400 text-xs mt-0.5 leading-none">{new Date().toLocaleDateString('tr-TR')}</span>
            </div>
          </div>

          {/* 2. Body Area (Input) */}
          <div className="bg-slate-50/30">

            {/* Custom Category Selector */}
            <div className="relative px-4 py-3 border-b border-slate-100/50" ref={dropdownRef}>
              <input
                type="text"
                placeholder="Bir kategori seçin veya yeni yazın..."
                className="w-full bg-transparent text-sm text-slate-700 font-medium placeholder-slate-400 outline-none"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
              />

              {/* Custom Autocomplete Dropdown */}
              {showSuggestions && (category || filteredCategories.length > 0) && (
                <div className="absolute left-0 right-0 top-full bg-white border-b border-slate-200 shadow-lg rounded-b-xl z-30 max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((cat, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCategory(cat.name);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-between group"
                      >
                        <span>{cat.name}</span>
                        {/* Optional: Add icon or visual cue */}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-xs text-slate-400 italic">
                      "{category}" yeni kategori olarak eklenecek.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4">
              <textarea
                placeholder="Ne düşünüyorsun?"
                className="w-full h-32 bg-transparent border-none text-slate-700 placeholder-slate-400 outline-none resize-none font-['Ubuntu'] text-lg"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={uploading}
              />

              {/* YouTube URL Input — linkini yapıştır, otomatik algılar */}
              {showYoutubeInput && (
                <div className="flex items-center gap-2 px-1 py-2 mt-1 border-t border-slate-100/80 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <FaYoutube size={16} className="text-red-500 shrink-0" />
                  <input
                    type="url"
                    autoFocus
                    placeholder="YouTube linkini yapıştır..."
                    value={youtubeDraft}
                    onChange={handleYoutubeInput}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') { setShowYoutubeInput(false); setYoutubeDraft(''); }
                    }}
                    className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder-slate-400 font-['Ubuntu']"
                  />
                  {youtubeDraft && (
                    <button onClick={() => setYoutubeDraft('')} className="text-slate-400 shrink-0 hover:text-slate-600">
                      <FiX size={14} />
                    </button>
                  )}
                </div>
              )}

              {/* Medya Önizleme Şeridi (Görsel + YouTube) */}
              {(existingImages.length > 0 || newFiles.length > 0 || youtubeId) && (
                <div className="mt-2 flex items-center gap-2 overflow-x-auto h-[56px] py-1 px-1 scrollbar-hide">

                  {/* YouTube Küçük Önizleme */}
                  {youtubeId && (
                    <div className="relative flex-shrink-0 w-10 h-10 rounded-md overflow-hidden group border-2 border-red-400">
                      <img
                        src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                        alt="YouTube"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <FaYoutube size={16} className="text-white drop-shadow-md" />
                      </div>
                      <button
                        onClick={() => setYoutubeId('')}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  )}

                  {/* Mevcut Görseller */}
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

                  {/* Yeni Dosyalar */}
                  {newFiles.map((file, index) => (
                    <div key={`new-${index}`} className="relative flex-shrink-0 w-10 h-10 rounded-md overflow-hidden group border border-blue-200 ring-1 ring-blue-100">
                      <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" onLoad={(e) => URL.revokeObjectURL(e.target.src)} />
                      {uploading ? (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                        </div>
                      ) : (
                        <button
                          onClick={() => removeNewFile(index)}
                          className="absolute inset-0 bg-blue-500/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                        >
                          <FiX size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Gizli Dosya Input */}
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
            {uploading ? (
              /* ── Yükleme Durumu ── */
              <div className="bg-slate-100/50 px-4 h-14 border-t border-slate-100 flex flex-col justify-center gap-2">
                <div className="flex items-center justify-between leading-none">
                  <span className="text-xs text-slate-500 font-['Ubuntu'] font-medium animate-pulse">
                    {newFiles.length > 0 ? `${newFiles.length} görsel yükleniyor...` : 'Kaydediliyor...'}
                  </span>
                  <span className="text-xs text-slate-400 font-['Ubuntu']">Lütfen bekleyin</span>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-1 bg-slate-200 rounded-full progress-bar-indeterminate" />
              </div>
            ) : (
              /* ── Normal Durum ── */
              <div className="bg-slate-100/50 px-4 h-14 flex justify-between items-center border-t border-slate-100">
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleImageClick}
                    className={`transition-colors p-2 rounded-full hover:bg-slate-200/50 ${newFiles.length > 0 || existingImages.length > 0 ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Resim Ekle"
                  >
                    <FiImage size={24} />
                  </button>
                  <button
                    onClick={() => setShowYoutubeInput(prev => !prev)}
                    className={`transition-colors p-2 rounded-full hover:bg-slate-200/50 ${
                      youtubeId ? 'text-red-500 bg-red-50'
                      : showYoutubeInput ? 'text-red-400 bg-red-50/50'
                      : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title="YouTube Video Ekle"
                  >
                    <FaYoutube size={24} />
                  </button>
                </div>

                <button
                  onClick={handleSave}
                  disabled={!content.trim() && existingImages.length === 0 && newFiles.length === 0 && !youtubeId}
                  className={`transform transition-all duration-200 active:scale-90 p-2 ${
                    content.trim() || existingImages.length > 0 || newFiles.length > 0 || youtubeId
                      ? 'text-blue-600 hover:scale-110'
                      : 'text-slate-300'
                  }`}
                >
                  <FiSend size={24} />
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};


export default CreatePost;
