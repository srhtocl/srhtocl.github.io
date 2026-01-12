import { collectionRef } from "./firebase";
import { doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, setDoc, query, where, onSnapshot } from "firebase/firestore";

// --- HELPER FOR STANDARDIZED ANSWERS ---
/**
 * Creates a standard service response object.
 * @param {boolean} success - Operation success status
 * @param {any} data - Result data (if any)
 * @param {Object} error - Error object (if any)
 * @returns {Object} { success, data, error }
 */
const createResponse = (success, data = null, error = null) => ({
    success,
    data,
    error: error ? { code: error.code || 'UNKNOWN', message: error.message || 'An error occurred' } : null
});

// --- CORE METHODS WITH ERROR HANDLING ---

async function getAllDocumentsIds() {
    try {
        const querySnapshot = await getDocs(collectionRef);
        const docIds = [];
        querySnapshot.forEach((doc) => docIds.push(doc.id));
        return createResponse(true, docIds);
    } catch (error) {
        console.error("Service Error (getAllDocumentsIds):", error);
        return createResponse(false, null, error);
    }
}

async function insertDocument(data) {
    try {
        const docRef = await addDoc(collectionRef, data);
        return createResponse(true, { id: docRef.id });
    } catch (error) {
        console.error("Service Error (insertDocument):", error);
        return createResponse(false, null, error);
    }
}

async function updateDocument(docId, data) {
    try {
        const docRef = doc(collectionRef, docId);
        await updateDoc(docRef, data);
        return createResponse(true);
    } catch (error) {
        console.error("Service Error (updateDocument):", error);
        return createResponse(false, null, error);
    }
}

async function deleteDocument(docId) {
    try {
        const docRef = doc(collectionRef, docId);
        await deleteDoc(docRef);
        return createResponse(true);
    } catch (error) {
        console.error("Service Error (deleteDocument):", error);
        return createResponse(false, null, error);
    }
}

async function getDocumentById(docId) {
    try {
        const docRef = doc(collectionRef, docId);
        const docSnapshot = await getDoc(docRef);

        if (docSnapshot.exists()) {
            return createResponse(true, docSnapshot.data());
        } else {
            return createResponse(false, null, { code: 'NOT_FOUND', message: 'Document not found' });
        }
    } catch (error) {
        console.error("Service Error (getDocumentById):", error);
        return createResponse(false, null, error);
    }
}

async function getDocumentsByUsername(user) {
    try {
        if (!user) throw new Error("Username parameter is required");

        const q = query(collectionRef, where("user", "==", user));
        const querySnapshot = await getDocs(q);
        const documents = [];

        querySnapshot.forEach((doc) => documents.push({ ...doc.data(), id: doc.id }));

        if (documents.length === 0) {
            return createResponse(false, null, { code: 'NOT_FOUND', message: 'User not found' });
        }

        return createResponse(true, documents[0]);

    } catch (error) {
        console.error("Service Error (getDocumentsByUsername):", error);
        return createResponse(false, null, error);
    }
}

async function setDocument(user, payload) {
    try {
        // First, check if document exists to get the ID
        // Note: calling our own service method effectively chains the response format logic
        const response = await getDocumentsByUsername(user);

        if (!response.success && response.error?.code === 'NOT_FOUND') {
            // If not found, maybe we should create it? 
            // Logic in useChat creates it via insertDocument first, so this might be strict update.
            // But 'setDoc' usually implies "Create or Overwrite if ID known". 
            // Since we query by 'user' field, we need the doc ID.
            return createResponse(false, null, { code: 'NOT_FOUND', message: 'Target document for user not found' });
        }

        if (!response.success) return response; // Return the bubbling error

        const docData = response.data;
        const docRef = doc(collectionRef, docData.id);

        await setDoc(docRef, payload);
        return createResponse(true);

    } catch (error) {
        console.error("Service Error (setDocument):", error);
        return createResponse(false, null, error);
    }
}

// --- SUBSCRIPTIONS (Callback Pattern) ---
// Subscriptions don't return Promises, so they handle errors via a second callback or internal logging.
// To keep valid interface, we won't change the signature too much but ensure robustness.

function subscribeToAllMessages(callback) {
    const q = query(collectionRef);
    return onSnapshot(q,
        (snapshot) => {
            const messages = [];
            snapshot.forEach((doc) => {
                messages.push({ ...doc.data(), docId: doc.id });
            });
            callback(messages); // We could pass { success: true, data: messages } but UI expects array directly currently.
            // Changing subscription signature is risky for Phase 2. Let's keep data-only for now or wrap it?
            // Let's keep it simple for subscriptions: Just Data.
        },
        (error) => {
            console.error("Subscription Error (All):", error);
            // Optionally call callback with null or specific error state if UI supports it
        }
    );
}

function subscribeToMessages(user, callback) {
    if (!user) return () => { };

    const q = query(collectionRef, where("user", "==", user));

    return onSnapshot(q,
        (snapshot) => {
            if (!snapshot.empty) {
                callback({ success: true, ...snapshot.docs[0].data() }); // Merging success flag might be useful? 
                // Wait, useChat expects `data.messages`.
                // Let's keep receiving pure data structure to minimize "Read" refactor impact, 
                // but we fixed "Write" operations which are the main source of errors.
                // Actually, let's keep it pure data for subscriptions to match `useChat` expectations 
                // unless we want to rewrite useChat subscription handler too.
                callback(snapshot.docs[0].data());
            } else {
                // Document deleted or not found
                callback(null);
            }
        },
        (error) => {
            console.error("Subscription Error (User):", error);
        }
    );
}


export {
    getDocumentById,
    getDocumentsByUsername,
    getAllDocumentsIds,
    setDocument,
    insertDocument, // returns { success, data: { id } }
    updateDocument,
    deleteDocument,
    subscribeToMessages,
    subscribeToAllMessages,
};