import React, { useEffect, useState, useRef, useMemo } from "react";
import Post from "../components/post";
import { getPaginatedPosts } from "../services/post-methods";
import { getAllCategories } from "../services/category-methods";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FiX, FiFilter, FiChevronDown, FiCheck, FiSearch } from "react-icons/fi";

export default function AllPosts() {

    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [lastVisible, setLastVisible] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [showCategoryMenu, setShowCategoryMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchInputRef = useRef(null);
    const observer = useRef();

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const categoryFilter = searchParams.get('category');

    // Client-side full-text filter uygula
    const filteredPosts = useMemo(() => {
        if (!searchQuery.trim()) return posts;
        const q = searchQuery.toLowerCase();
        return posts.filter(post =>
            post.content?.toLowerCase().includes(q) ||
            post.category?.toLowerCase().includes(q)
        );
    }, [posts, searchQuery]);

    const lastPostCallbackRef = React.useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchMorePosts();
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    const fetchMorePosts = async (customLastVisible = null) => {
        if (loading && !customLastVisible) return;
        if (!hasMore && !customLastVisible) return;

        setLoading(true);
        const currentLast = customLastVisible || lastVisible;

        try {
            let response = await getPaginatedPosts(currentLast, 10, categoryFilter);
            let attempt = 0;

            while (response.posts.length === 0 && response.hasMore && attempt < 5) {
                response = await getPaginatedPosts(response.lastVisible, 10, categoryFilter);
                attempt++;
            }

            if (response.posts.length > 0) {
                setPosts(prev => [...prev, ...response.posts]);
            }

            setLastVisible(response.lastVisible);
            setHasMore(response.hasMore);
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePost = (postId) => {
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    };

    const handleClearSearch = () => {
        setSearchQuery("");
        searchInputRef.current?.focus();
    };

    useEffect(() => {
        getAllCategories().then(setCategories);

        (async () => {
            setLoading(true);
            setPosts([]);
            setLastVisible(null);
            setHasMore(true);
            setSearchQuery(""); // kategori değişince aramayı sıfırla

            try {
                let response = await getPaginatedPosts(null, 10, categoryFilter);
                let attempt = 0;

                while (response.posts.length === 0 && response.hasMore && attempt < 5) {
                    response = await getPaginatedPosts(response.lastVisible, 10, categoryFilter);
                    attempt++;
                }

                setPosts(response.posts);
                setLastVisible(response.lastVisible);
                setHasMore(response.hasMore);
            } catch (err) {
                console.error("Initial load error:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [categoryFilter]);

    return (
        <div className="relative flex flex-col w-full h-[100dvh] overflow-hidden bg-slate-50">

            {/* Background Atmosphere */}
            <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-slate-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-gray-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

            {/* Posts Feed */}
            <div className="flex-1 overflow-y-auto z-10 w-full max-w-2xl mx-auto px-4 py-6 custom-scrollbar space-y-4">

                {/* ── Arama + Kategori Filtre Barı ── */}
                <div className="w-full bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 mb-4 relative z-20">
                    <div className="flex items-center gap-2 px-4 py-3">

                        {/* Sol: Arama İkonu + Input */}
                        <FiSearch size={18} className="text-slate-400 shrink-0" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Gönderilerde ara..."
                            className="flex-1 bg-transparent text-slate-700 placeholder-slate-400 outline-none text-sm font-['Ubuntu'] min-w-0"
                        />

                        {/* Temizle butonu (arama varsa) */}
                        {searchQuery && (
                            <button
                                onClick={handleClearSearch}
                                className="shrink-0 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                title="Aramayı temizle"
                            >
                                <FiX size={16} />
                            </button>
                        )}

                        {/* Dikey Ayırıcı */}
                        <div className="w-px h-5 bg-slate-200 shrink-0"></div>

                        {/* Sağ: Kategori Pill Butonu */}
                        <div className="relative shrink-0">
                            <button
                                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all font-['Ubuntu']
                                    ${categoryFilter
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                title="Kategoriye göre filtrele"
                            >
                                <FiFilter size={14} />
                                <span className="max-w-[80px] truncate hidden xs:block">
                                    {categoryFilter || 'Kategori'}
                                </span>
                                <FiChevronDown
                                    size={14}
                                    className={`transition-transform duration-200 ${showCategoryMenu ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {/* Kategori Dropdown */}
                            {showCategoryMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowCategoryMenu(false)}
                                    ></div>
                                    <div className="absolute right-0 top-10 w-52 bg-white border border-slate-100 shadow-xl rounded-xl py-2 z-20 animate-in fade-in zoom-in-95 duration-200 max-h-64 overflow-y-auto custom-scrollbar">
                                        <button
                                            onClick={() => {
                                                navigate('/posts');
                                                setShowCategoryMenu(false);
                                            }}
                                            className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors ${!categoryFilter ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            <span className="font-medium">Tümü</span>
                                            {!categoryFilter && <FiCheck size={16} />}
                                        </button>

                                        <div className="h-px bg-slate-100 my-1 mx-2"></div>

                                        {categories.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => {
                                                    navigate(`/posts?category=${encodeURIComponent(cat.name)}`);
                                                    setShowCategoryMenu(false);
                                                }}
                                                className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors ${categoryFilter === cat.name ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                <span>{cat.name}</span>
                                                {categoryFilter === cat.name && <FiCheck size={16} />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Aktif arama bilgisi */}
                    {searchQuery && (
                        <div className="px-4 pb-2.5 flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-['Ubuntu']">
                                {filteredPosts.length === 0
                                    ? '"' + searchQuery + '" için sonuç bulunamadı'
                                    : `"${searchQuery}" için ${filteredPosts.length} gönderi`
                                }
                            </span>
                        </div>
                    )}
                </div>

                {/* Post Listesi */}
                {filteredPosts.map((post, index) => {
                    const isLast = filteredPosts.length === index + 1;
                    return (
                        <div ref={isLast ? lastPostCallbackRef : null} key={post.id}>
                            <Post post={post} onDelete={handleDeletePost} />
                        </div>
                    );
                })}

                {loading && (
                    <div className="flex justify-center py-4">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
                    </div>
                )}

                {!hasMore && filteredPosts.length > 0 && !searchQuery && (
                    <p className="text-center text-slate-400 py-4 text-xs">Tüm gönderiler yüklendi.</p>
                )}

                {!loading && filteredPosts.length === 0 && !searchQuery && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 font-['Ubuntu']">
                        <p>Henüz gönderi yok.</p>
                    </div>
                )}

                {!loading && filteredPosts.length === 0 && searchQuery && (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 font-['Ubuntu']">
                        <FiSearch size={32} className="opacity-30" />
                        <p className="text-sm">Arama sonucu bulunamadı.</p>
                        <button
                            onClick={handleClearSearch}
                            className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-800 transition-colors"
                        >
                            Aramayı temizle
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}