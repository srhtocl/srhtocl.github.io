import { categoryCollectionRef, postCollectionRef } from "./firebase";
import { db } from "./firebase";
import { doc, setDoc, getDocs, query, orderBy, where, writeBatch } from "firebase/firestore";

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
        const slug = categoryName
            .toLocaleLowerCase('tr-TR')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-çğıöşü]/g, '');

        if (!slug) return false;

        const docRef = doc(categoryCollectionRef, slug);

        await setDoc(docRef, {
            name: categoryName,
            slug: slug,
            last_updated: new Date()
        }, { merge: true });

        return true;
    } catch (error) {
        console.error("Error ensuring category exists:", error);
        return false;
    }
}

/**
 * Deletes a category document and clears the category field
 * from all posts that used it (batch write).
 * @param {string} categoryId - The document ID (slug) of the category to delete
 * @param {string} categoryName - The display name (used to find matching posts)
 * @returns {Promise<{ success: boolean, updatedPosts: number }>}
 */
export async function deleteCategory(categoryId, categoryName) {
    try {
        const batch = writeBatch(db);

        // 1. Delete the category document
        const catRef = doc(categoryCollectionRef, categoryId);
        batch.delete(catRef);

        // 2. Find all posts with this category and clear their category field
        const postsQuery = query(postCollectionRef, where("category", "==", categoryName));
        const postsSnapshot = await getDocs(postsQuery);
        let updatedPosts = 0;

        postsSnapshot.forEach((postDoc) => {
            batch.update(postDoc.ref, { category: "" });
            updatedPosts++;
        });

        await batch.commit();
        return { success: true, updatedPosts };

    } catch (error) {
        console.error("Error deleting category:", error);
        return { success: false, updatedPosts: 0 };
    }
}

/**
 * Renames a category and updates all posts that use the old name.
 * Uses a Firestore batch write to update all affected posts atomically.
 * @param {string} categoryId - The document ID (slug) of the category
 * @param {string} oldName - The current display name
 * @param {string} newName - The new display name
 * @returns {Promise<{ success: boolean, updatedPosts: number }>}
 */
export async function renameCategory(categoryId, oldName, newName) {
    if (!newName?.trim()) return { success: false, updatedPosts: 0 };

    try {
        const newSlug = newName
            .toLocaleLowerCase('tr-TR')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-çğıöşü]/g, '');

        if (!newSlug) return { success: false, updatedPosts: 0 };

        const batch = writeBatch(db);

        // 1. Update the category document itself
        const oldCatRef = doc(categoryCollectionRef, categoryId);
        const newCatRef = doc(categoryCollectionRef, newSlug);

        // If the slug changes, delete old doc and create new one
        if (newSlug !== categoryId) {
            batch.delete(oldCatRef);
            batch.set(newCatRef, {
                name: newName.trim(),
                slug: newSlug,
                last_updated: new Date()
            });
        } else {
            // Same slug, just update name
            batch.update(oldCatRef, {
                name: newName.trim(),
                last_updated: new Date()
            });
        }

        // 2. Find all posts with the old category name and update them
        const postsQuery = query(postCollectionRef, where("category", "==", oldName));
        const postsSnapshot = await getDocs(postsQuery);
        let updatedPosts = 0;

        postsSnapshot.forEach((postDoc) => {
            batch.update(postDoc.ref, { category: newName.trim() });
            updatedPosts++;
        });

        await batch.commit();
        return { success: true, updatedPosts };

    } catch (error) {
        console.error("Error renaming category:", error);
        return { success: false, updatedPosts: 0 };
    }
}
