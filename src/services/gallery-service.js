import { ref, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Fetches all images from the 'posts/' directory in Firebase Storage.
 * @returns {Promise<Array>} Array of image objects { url, ref, name }
 */
export const fetchAllImages = async () => {
    const postsRef = ref(storage, 'posts/');
    const profileRef = ref(storage, 'profile/');

    // Her iki klasörü de oku (Hata verirse boş array dön)
    const [postsRes, profileRes] = await Promise.all([
        listAll(postsRef).catch(() => ({ items: [] })),
        listAll(profileRef).catch(() => ({ items: [] }))
    ]);

    const allItems = [...postsRes.items, ...profileRes.items];

    const urlPromises = allItems.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return { url, ref: itemRef, name: itemRef.name };
    });

    const resolvedImages = await Promise.all(urlPromises);

    // Sort by name descending (assuming timestamp naming convention)
    resolvedImages.sort((a, b) => b.name.localeCompare(a.name));

    return resolvedImages;
};

/**
 * Deletes an image from Firebase Storage.
 * @param {Object} imageRef - The Firebase Storage reference of the image to delete
 */
export const deleteImageFromStorage = async (imageRef) => {
    await deleteObject(imageRef);
};
