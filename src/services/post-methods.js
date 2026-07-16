import { postCollectionRef } from "./firebase";

import { doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, orderBy, limit, startAfter, where } from "firebase/firestore";

// --- HELPER FOR STANDARDIZED ANSWERS ---
const createResponse = (success, data = null, error = null) => ({
    success,
    data,
    error: error ? { code: error.code || 'UNKNOWN', message: error.message || 'An error occurred' } : null
});

// --- CORE METHODS ---

async function getAllDocuments() {
    try {
        const querySnapshot = await getDocs(postCollectionRef);
        const docs = [];
        querySnapshot.forEach((doc) => {
            docs.push({ ...doc.data(), id: doc.id });
        });
        return createResponse(true, docs);
    } catch (error) {
        console.error("Service Error (getAllDocuments):", error);
        return createResponse(false, null, error);
    }
}

async function getAllDocumentsIds() {
    try {
        const querySnapshot = await getDocs(postCollectionRef);
        const docIds = [];
        querySnapshot.forEach((doc) => {
            docIds.push(doc.id);
        });
        return createResponse(true, docIds);
    } catch (error) {
        console.error("Service Error (getAllDocumentsIds):", error);
        return createResponse(false, null, error);
    }
}

async function getPaginatedPosts(lastVisible = null, limitCount = 10, category = null, archivedOnly = false) {
    try {
        let q;
        if (category) {
            if (lastVisible) {
                q = query(postCollectionRef, where("category", "==", category), orderBy("timestamp", "desc"), startAfter(lastVisible), limit(limitCount));
            } else {
                q = query(postCollectionRef, where("category", "==", category), orderBy("timestamp", "desc"), limit(limitCount));
            }
        } else {
            if (lastVisible) {
                q = query(postCollectionRef, orderBy("timestamp", "desc"), startAfter(lastVisible), limit(limitCount));
            } else {
                q = query(postCollectionRef, orderBy("timestamp", "desc"), limit(limitCount));
            }
        }

        const querySnapshot = await getDocs(q);
        const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        const hasMore = querySnapshot.size === limitCount;

        const posts = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (archivedOnly) {
                // Sadece arşivlenenler
                if (Array.isArray(data.status) && data.status.includes('archived')) {
                    posts.push({ ...data, id: doc.id });
                }
            } else {
                // Sadece yayındakiler (eski format dahil)
                if (!data.status || (Array.isArray(data.status) && data.status.includes('published'))) {
                    posts.push({ ...data, id: doc.id });
                }
            }
        });

        return { posts, lastVisible: lastVisibleDoc, hasMore };

    } catch (error) {
        console.error("Service Error (getPaginatedPosts):", error);
        return { posts: [], lastVisible: null, hasMore: false };
    }
}

async function insertDocument(data) {
    try {
        const docRef = await addDoc(postCollectionRef, data);
        return createResponse(true, { id: docRef.id });
    } catch (error) {
        console.error("Service Error (insertDocument):", error);
        return createResponse(false, null, error);
    }
}

async function updateDocument(docId, data) {
    try {
        const docRef = doc(postCollectionRef, docId);
        await updateDoc(docRef, data);
        return createResponse(true);
    } catch (error) {
        console.error("Service Error (updateDocument):", error);
        return createResponse(false, null, error);
    }
}

async function deleteDocument(docId) {
    try {
        const docRef = doc(postCollectionRef, docId);

        // Reverted: We do NOT delete images from Storage automatically anymore.
        // User wants to keep them for a potential Gallery feature.

        await deleteDoc(docRef);
        return createResponse(true);
    } catch (error) {
        console.error("Service Error (deleteDocument):", error);
        return createResponse(false, null, error);
    }
}

async function getDocumentById(docId) {
    try {
        const docRef = doc(postCollectionRef, docId);
        const docSnapshot = await getDoc(docRef);

        if (docSnapshot.exists()) {
            return createResponse(true, { ...docSnapshot.data(), id: docSnapshot.id });
        } else {
            return createResponse(false, null, { code: 'NOT_FOUND', message: 'Document not found' });
        }
    } catch (error) {
        console.error("Service Error (getDocumentById):", error);
        return createResponse(false, null, error);
    }
}

async function updatePostStatus(docId, status) {
    try {
        const docRef = doc(postCollectionRef, docId);
        await updateDoc(docRef, { status: status });
        return createResponse(true);
    } catch (error) {
        console.error("Service Error (updatePostStatus):", error);
        return createResponse(false, null, error);
    }
}

export {
    getDocumentById,
    getAllDocuments,
    getPaginatedPosts,
    getAllDocumentsIds,
    insertDocument,
    updateDocument,
    updatePostStatus,
    deleteDocument,
};