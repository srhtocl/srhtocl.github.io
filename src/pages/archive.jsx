import React, { useEffect, useState, useCallback, useRef } from "react";
import { getPaginatedPosts, updatePostStatus } from "../services/post-methods";
import Post from "../components/post";
import { FiArchive } from "react-icons/fi";
import toast from "react-hot-toast";

const LIMIT = 10;

export default function Archive() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastVisible, setLastVisible] = useState(null);
    const [hasMore, setHasMore] = useState(false);

    const observer = useRef();

    // IntersectionObserver — son elemente bağlanır, görününce daha fazla yükler
    const lastPostCallbackRef = useCallback(node => {
        if (loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchMore();
            }
        });
        if (node) observer.current.observe(node);
    }, [loadingMore, hasMore]);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        const result = await getPaginatedPosts(null, LIMIT, null, true);
        setPosts(result.posts);
        setLastVisible(result.lastVisible);
        setHasMore(result.hasMore);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const fetchMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        const result = await getPaginatedPosts(lastVisible, LIMIT, null, true);
        setPosts(prev => [...prev, ...result.posts]);
        setLastVisible(result.lastVisible);
        setHasMore(result.hasMore);
        setLoadingMore(false);
    };

    const handleUnarchive = async (postId) => {
        const success = await updatePostStatus(postId, ["published"]);
        if (success) {
            toast.success("Gönderi yayına alındı.");
            setPosts(prev => prev.filter(p => p.id !== postId));
        } else {
            toast.error("İşlem başarısız oldu.");
        }
    };

    return (
        <div className="relative flex flex-col w-full h-[100dvh] overflow-hidden bg-slate-50">

            {/* Background Atmosphere */}
            <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-slate-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-gray-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 pointer-events-none" />

            {/* Posts Feed */}
            <div className="flex-1 overflow-y-auto z-10 w-full max-w-2xl mx-auto px-4 pt-20 pb-24 custom-scrollbar space-y-4">

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
                        <FiArchive size={40} className="opacity-30" />
                        <p className="font-['Ubuntu'] text-sm">Arşivde hiç gönderi yok.</p>
                    </div>
                ) : (
                    <>
                        {posts.map((post, index) => {
                            const isLast = index === posts.length - 1;
                            return (
                                <div ref={isLast ? lastPostCallbackRef : null} key={post.id}>
                                    <Post
                                        post={post}
                                        onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                                        onUnarchive={handleUnarchive}
                                    />
                                </div>
                            );
                        })}

                        {/* Yükleniyor göstergesi */}
                        {loadingMore && (
                            <div className="flex justify-center py-4">
                                <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
