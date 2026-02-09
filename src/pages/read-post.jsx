import React, { useEffect, useState } from "react";
import Post from "../components/post";
import { getPaginatedPosts } from "../services/post-methods";
import { getAllCategories } from "../services/category-methods";
import { useAuth } from "../context/auth-context";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FiX, FiFilter, FiChevronDown, FiCheck } from "react-icons/fi";
export default function AllPosts() {

    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [lastVisible, setLastVisible] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [showCategoryMenu, setShowCategoryMenu] = useState(false); // Dropdown Menu State
    const observer = React.useRef();

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const categoryFilter = searchParams.get('category');


    const lastPostElementRef = React.useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setLastVisible(prev => prev); // Trigger fetch via effect or call directly
                fetchMorePosts();
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]); // Removed dependencies to avoid re-creation logic issues, keeping simple


    const fetchMorePosts = async () => {
        if (loading || !hasMore) return;
        setLoading(true);

        const response = await getPaginatedPosts(lastVisible, 10, categoryFilter);


        if (response.posts.length > 0) {
            setPosts(prev => [...prev, ...response.posts]);
            setLastVisible(response.lastVisible);
            if (response.posts.length < 10) setHasMore(false);
        } else {
            setHasMore(false);
        }
        setLoading(false);
    };

    const handleDeletePost = (postId) => {
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    };

    useEffect(() => {
        // Fetch Categories once
        getAllCategories().then(setCategories);

        // Initial Load or when category changes
        (async () => {
            setLoading(true);
            setPosts([]); // Clear previous posts
            setLastVisible(null);
            setHasMore(true);

            const response = await getPaginatedPosts(null, 10, categoryFilter);
            setPosts(response.posts);
            setLastVisible(response.lastVisible);
            if (response.posts.length < 10) setHasMore(false);
            setLoading(false);
        })()
    }, [categoryFilter]); // Re-run when categoryFilter changes


    return (

        <div className="relative flex flex-col w-full h-[100dvh] overflow-hidden bg-slate-50">

            {/* Background Atmosphere */}
            <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-slate-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-gray-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

            {/* Posts Feed */}
            <div className="flex-1 overflow-y-auto z-10 w-full max-w-2xl mx-auto px-4 py-6 custom-scrollbar space-y-4">

                {/* Category Filter Bar (Mimicking Post Component Style) */}
                <div className="w-full bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 mb-4 relative z-20">

                    {/* Custom Dropdown Trigger (Full Width) */}
                    <div className="relative">
                        <button
                            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 rounded-xl transition-colors font-medium text-slate-700 font-['Ubuntu']"
                        >
                            <span className="flex items-center gap-2">
                                <FiFilter size={18} className="text-slate-400" />
                                <span className={categoryFilter ? "text-slate-900 font-semibold" : "text-slate-600"}>
                                    {categoryFilter || 'Kategori Seç'}
                                </span>
                            </span>
                            <FiChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${showCategoryMenu ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu (Post Style) */}
                        {showCategoryMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowCategoryMenu(false)}
                                ></div>
                                <div className="absolute left-0 right-0 top-14 bg-white border border-slate-100 shadow-xl rounded-xl py-2 z-20 animate-in fade-in zoom-in-95 duration-200 max-h-64 overflow-y-auto custom-scrollbar">
                                    <button
                                        onClick={() => {
                                            navigate('/posts');
                                            setShowCategoryMenu(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between group transition-colors ${!categoryFilter ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
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
                                            className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between group transition-colors ${categoryFilter === cat.name ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
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

                {posts.map((post, index) => {
                    if (posts.length === index + 1) {
                        return (
                            <div ref={lastPostElementRef} key={post.id}>
                                <Post post={post} onDelete={handleDeletePost} />
                            </div>
                        );
                    } else {
                        return <Post key={post.id} post={post} onDelete={handleDeletePost} />;
                    }
                })}

                {loading && (
                    <div className="flex justify-center py-4">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
                    </div>
                )}

                {!hasMore && posts.length > 0 && (
                    <p className="text-center text-slate-400 py-4 text-xs">Tüm gönderiler yüklendi.</p>
                )}

                {!loading && posts.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 font-['Ubuntu']">
                        <p>Henüz gönderi yok.</p>
                    </div>
                )}
            </div>



        </div>
    );

}