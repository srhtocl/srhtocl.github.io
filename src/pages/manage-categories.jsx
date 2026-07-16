import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllCategories, renameCategory, deleteCategory } from "../services/category-methods";
import { FiEdit2, FiTrash2, FiCheck, FiX, FiTag } from "react-icons/fi";
import toast from "react-hot-toast";

export default function ManageCategories() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);   // which row is in edit mode
    const [editValue, setEditValue] = useState("");
    const [saving, setSaving] = useState(false);

    const fetchCategories = async () => {
        setLoading(true);
        const cats = await getAllCategories();
        setCategories(cats);
        setLoading(false);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const startEdit = (cat) => {
        setEditingId(cat.id);
        setEditValue(cat.name);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditValue("");
    };

    const handleRename = async (cat) => {
        const newName = editValue.trim();
        if (!newName || newName === cat.name) {
            cancelEdit();
            return;
        }

        setSaving(true);
        const result = await renameCategory(cat.id, cat.name, newName);
        setSaving(false);

        if (result.success) {
            toast.success(
                result.updatedPosts > 0
                    ? `"${newName}" olarak güncellendi. ${result.updatedPosts} gönderi de güncellendi.`
                    : `"${newName}" olarak güncellendi.`
            );
            cancelEdit();
            fetchCategories();
        } else {
            toast.error("Güncelleme başarısız oldu.");
        }
    };

    const handleDelete = async (cat) => {
        if (!window.confirm(`"${cat.name}" kategorisini silmek istediğinize emin misiniz?\n\nBu kategorideki gönderilerin etiketleri de temizlenecek.`)) return;

        const result = await deleteCategory(cat.id, cat.name);
        if (result.success) {
            const msg = result.updatedPosts > 0
                ? `"${cat.name}" silindi. ${result.updatedPosts} gönderinin etiketi temizlendi.`
                : `"${cat.name}" silindi.`;
            toast.success(msg);
            setCategories(prev => prev.filter(c => c.id !== cat.id));
        } else {
            toast.error("Silme işlemi başarısız oldu.");
        }
    };

    return (
        <div className="relative flex flex-col w-full h-[100dvh] overflow-hidden bg-slate-50">

            {/* Background Atmosphere */}
            <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-slate-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-gray-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob animation-delay-2000 pointer-events-none" />

            {/* Content */}
            <div className="flex-1 overflow-y-auto z-10 w-full max-w-2xl mx-auto px-4 py-6 custom-scrollbar">

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
                    </div>
                ) : categories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 font-['Ubuntu']">
                        <FiTag size={32} className="opacity-30" />
                        <p className="text-sm">Henüz hiç kategori yok.</p>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        {categories.map((cat, index) => (
                            <div
                                key={cat.id}
                                className={`flex items-center gap-3 px-4 py-3.5 ${index !== categories.length - 1 ? 'border-b border-slate-100' : ''}`}
                            >
                                {editingId === cat.id ? (
                                    /* ── Edit Mode ── */
                                    <>
                                        <input
                                            autoFocus
                                            value={editValue}
                                            onChange={e => setEditValue(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') handleRename(cat);
                                                if (e.key === 'Escape') cancelEdit();
                                            }}
                                            className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-800 font-['Ubuntu'] outline-none focus:border-slate-500 transition-colors"
                                            disabled={saving}
                                        />
                                        <button
                                            onClick={() => handleRename(cat)}
                                            disabled={saving}
                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                                            title="Kaydet"
                                        >
                                            {saving
                                                ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                                                : <FiCheck size={18} />
                                            }
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            disabled={saving}
                                            className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                                            title="İptal"
                                        >
                                            <FiX size={18} />
                                        </button>
                                    </>
                                ) : (
                                    /* ── Normal Mode ── */
                                    <>
                                        <FiTag size={16} className="text-slate-400 shrink-0" />
                                        <span
                                            onClick={() => navigate(`/posts?category=${encodeURIComponent(cat.name)}`)}
                                            className="flex-1 text-sm text-slate-700 font-['Ubuntu'] font-medium cursor-pointer hover:text-blue-500 transition-colors"
                                        >
                                            {cat.name}
                                        </span>
                                        <button
                                            onClick={() => startEdit(cat)}
                                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                            title="Yeniden Adlandır"
                                        >
                                            <FiEdit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cat)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Sil"
                                        >
                                            <FiTrash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <p className="text-xs text-slate-400 text-center mt-4 font-['Ubuntu'] px-4">
                    Bir kategoriyi silmek o kategorideki gönderileri silmez, yalnızca kategorisiz bırakır.
                </p>
            </div>
        </div>
    );
}
