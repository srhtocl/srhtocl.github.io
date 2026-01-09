import React, { useEffect, useState } from "react";
import Post from "../components/post";
import { getPaginatedPosts } from "../services/post-methods";
import { useAuth } from "../context/auth-context";
export default function AllPosts() {

    const [posts, setPosts] = useState([]);
    const [lastVisible, setLastVisible] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const observer = React.useRef();

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
    }, [loading, hasMore]);

    const fetchMorePosts = async () => {
        if (loading || !hasMore) return;
        setLoading(true);

        const response = await getPaginatedPosts(lastVisible);

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
        // Initial Load
        (async () => {
            setLoading(true);
            const response = await getPaginatedPosts(null);
            setPosts(response.posts);
            setLastVisible(response.lastVisible);
            if (response.posts.length < 10) setHasMore(false);
            setLoading(false);
        })()
    }, []);

    return (

        <div className="relative flex flex-col w-full h-[100dvh] overflow-hidden bg-slate-50">

            {/* Background Atmosphere */}
            <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-slate-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-gray-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

            {/* Posts Feed */}
            <div className="flex-1 overflow-y-auto z-10 w-full max-w-2xl mx-auto px-4 py-6 custom-scrollbar space-y-4">
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