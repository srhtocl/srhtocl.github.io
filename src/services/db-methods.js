import { collectionRef } from "./firebase";
import { doc, updateDoc, deleteDoc, getDoc, getDocs, setDoc, query, onSnapshot, arrayUnion, serverTimestamp } from "firebase/firestore";

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

// Doküman ID'si artık ziyaretçinin çerez değeriyle birebir aynı olduğundan
// (bkz. useChat.js), önce sorguyla ID bulup sonra yazma adımına gerek kalmadı.
// Doküman yoksa merge:true ile otomatik oluşturulur, varsa güncellenir.
async function setDocument(docId, payload) {
    try {
        const docRef = doc(collectionRef, docId);
        await setDoc(docRef, payload, { merge: true });
        return createResponse(true);
    } catch (error) {
        console.error("Service Error (setDocument):", error);
        return createResponse(false, null, error);
    }
}

// Mesajı dizinin sonuna atomik olarak ekler. Tüm diziyi yeniden yazmak yerine
// arrayUnion kullanıldığı için admin ile ziyaretçi aynı anda yazsa bile
// birinin mesajı diğerininkini ezmez; firestore.rules de yalnızca bu
// "sona tek mesaj ekleme" biçimine izin verir.
// Ziyaretçi mesajlarında lastVisitorMessageAt sunucu saatiyle yazılır;
// kurallar bunu spam sınırı (mesajlar arası en az 3 sn) için kullanır.
async function appendMessage(docId, message, { asVisitor = false } = {}) {
    try {
        const docRef = doc(collectionRef, docId);
        const data = { messages: arrayUnion(message) };
        if (asVisitor) data.lastVisitorMessageAt = serverTimestamp();
        await updateDoc(docRef, data);
        return createResponse(true);
    } catch (error) {
        console.error("Service Error (appendMessage):", error);
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
            callback(messages);
        },
        (error) => {
            console.error("Subscription Error (All):", error);
        }
    );
}

function subscribeToMessages(user, callback) {
    if (!user) return () => { };

    const docRef = doc(collectionRef, user);

    return onSnapshot(docRef,
        (docSnapshot) => {
            callback(docSnapshot.exists() ? docSnapshot.data() : null);
        },
        (error) => {
            console.error("Subscription Error (User):", error);
        }
    );
}


export {
    getDocumentById,
    getAllDocumentsIds,
    setDocument,
    appendMessage,
    updateDocument,
    deleteDocument,
    subscribeToMessages,
    subscribeToAllMessages,
};