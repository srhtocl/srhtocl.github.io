/**
 * @file gallery-picker.jsx
 * @description Mevcut galerideki fotoğrafları listeleyip seçmeyi sağlayan modal bileşen.
 * Sıralama edit-profile.jsx'teki drag-to-reorder ile yapılır; bu modal yalnızca seçim içindir.
 *
 * @props
 *   isOpen          {boolean}    - Modal açık mı?
 *   onClose         {Function}   - Modal kapatma callback'i
 *   onConfirm       {Function}   - Seçilen URL listesiyle çağrılan callback: (urls: string[]) => void
 *   alreadySelected {string[]}   - Zaten profilde olan URL'ler (başlangıçta seçili gösterilir)
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiX, FiCheck, FiLoader } from 'react-icons/fi';
import { fetchAllImages } from '../services/gallery-service';

const GalleryPicker = ({ isOpen, onClose, onConfirm, alreadySelected = [] }) => {
    const [images, setImages] = useState([]);
    const [selected, setSelected] = useState(new Set());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        setSelected(new Set(alreadySelected));
        fetchAllImages()
            .then(imgs => setImages(imgs))
            .catch(err => console.error('[GalleryPicker] Yükleme hatası:', err))
            .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const toggleSelect = (url) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(url)) next.delete(url);
            else next.add(url);
            return next;
        });
    };

    const handleConfirm = () => {
        // Seçim sırası: alreadySelected önce (mevcut sırayı koru), yeni eklenenler sona
        const kept = alreadySelected.filter(u => selected.has(u));
        const added = Array.from(selected).filter(u => !alreadySelected.includes(u));
        onConfirm([...kept, ...added]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
                    <div>
                        <h2 className="font-semibold text-slate-800 text-base">Galeriden Seç</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {selected.size > 0 ? `${selected.size} fotoğraf seçildi` : 'Fotoğraflara tıklayarak seç'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors" aria-label="Kapat">
                        <FiX size={20} />
                    </button>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4 min-h-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-40 text-slate-400">
                            <FiLoader size={24} className="animate-spin" />
                        </div>
                    ) : images.length === 0 ? (
                        <div className="text-center text-slate-400 py-12 text-sm">
                            Galeride henüz fotoğraf yok.
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2.5">
                            {images.map((img, idx) => {
                                const isSelected = selected.has(img.url);
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => toggleSelect(img.url)}
                                        className="relative aspect-square rounded-xl overflow-hidden group focus:outline-none"
                                        aria-label={`Fotoğraf ${idx + 1}${isSelected ? ' (seçili)' : ''}`}
                                    >
                                        <img
                                            src={img.url}
                                            alt={`Galeri ${idx + 1}`}
                                            className={`w-full h-full object-cover transition-all duration-200 ${isSelected ? 'brightness-75' : 'group-hover:brightness-90'}`}
                                            loading="lazy"
                                        />
                                        {/* Seçim işareti */}
                                        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
                                            <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                                <FiCheck size={16} className="text-slate-800" strokeWidth={2.5} />
                                            </div>
                                        </div>
                                        {/* Seçili kenarlık */}
                                        <div className={`absolute inset-0 rounded-xl ring-2 pointer-events-none transition-all duration-200 ${isSelected ? 'ring-slate-700' : 'ring-transparent'}`} />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0 bg-white">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
                    >
                        Vazgeç
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-700 transition-colors"
                    >
                        {selected.size > 0 ? `${selected.size} Fotoğrafı Uygula` : 'Seçimi Temizle'}
                    </button>
                </div>
            </div>
        </div>
    );
};

GalleryPicker.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    alreadySelected: PropTypes.arrayOf(PropTypes.string)
};

export default GalleryPicker;
