import { useState, useEffect, useCallback } from 'react';
import { fetchAllImages, deleteImageFromStorage } from '../services/gallery-service';
import { toast } from 'react-hot-toast';

export const useGallery = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadImages = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchAllImages();
            setImages(data);
        } catch (error) {
            console.error("Galeri hatası:", error);
            toast.error("Resimler yüklenemedi.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadImages();
    }, [loadImages]);

    const removeImage = async (imageItem) => {
        try {
            await deleteImageFromStorage(imageItem.ref);
            setImages(prev => prev.filter(img => img.url !== imageItem.url));
            toast.success("Resim silindi.");
            return true;
        } catch (error) {
            console.error("Silme hatası:", error);
            toast.error("Silinemedi.");
            return false;
        }
    };

    return {
        images,
        loading,
        removeImage,
        refreshGallery: loadImages
    };
};
