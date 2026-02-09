import { categoryCollectionRef } from "./firebase";
import { doc, setDoc, getDocs, query, orderBy, deleteDoc } from "firebase/firestore";

/**
 * Fetches all categories from the 'categories' collection, ordered by name.
 * @returns {Promise<Array>} Array of category objects { id, name, slug }
 */
export async function getAllCategories() {
    try {
        const q = query(categoryCollectionRef, orderBy("name"));
        const querySnapshot = await getDocs(q);
        const categories = [];
        querySnapshot.forEach((doc) => {
            categories.push({ ...doc.data(), id: doc.id });
        });
        return categories;
    } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
}

/**
 * Ensures a category exists in the collection.
 * Creates it if it doesn't exist, using a slug as the document ID.
 * @param {string} categoryName - The display name of the category (e.g. "Teknoloji")
 * @returns {Promise<boolean>} True if successful
 */
export async function ensureCategoryExists(categoryName) {
    if (!categoryName) return false;

    try {
        // Create a slug from the name (e.g. "Teknoloji" -> "teknoloji")
        // Turkish character handling: İ -> i, I -> i, etc.
        const slug = categoryName
            .toLocaleLowerCase('tr-TR')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-çğıöşü]/g, '');

        if (!slug) return false;

        const docRef = doc(categoryCollectionRef, slug);
        
        await setDoc(docRef, {
            name: categoryName, // Keep original case for display
            slug: slug,
            last_updated: new Date()
        }, { merge: true }); // Merge prevents overwriting existing data if we add more fields later

        return true;
    } catch (error) {
        console.error("Error ensuring category exists:", error);
        return false;
    }
}
