import { postCollectionRef } from "./firebase";

import { doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, orderBy, limit, startAfter } from "firebase/firestore";




async function getAllDocuments() {

    let docs = [];

    try {

        const querySnapshot = await getDocs(postCollectionRef);

        querySnapshot.forEach((doc) => {
            docs.push({ ...doc.data(), id: doc.id });
        });

    }

    catch (error) { console.error("hata: ", error); }

    finally { return docs; }

}
async function getAllDocumentsIds() {

    let docIds = [];

    try {

        const querySnapshot = await getDocs(postCollectionRef);

        querySnapshot.forEach((doc) => {

            docIds.push(doc.id);

        });

    } catch (error) {

        console.error("hata: ", error);

    } finally {
        return docIds;
    }
}

async function getPaginatedPosts(lastVisible = null, limitCount = 10) {
    let response = { posts: [], lastVisible: null };

    try {
        let q;
        if (lastVisible) {
            q = query(postCollectionRef, orderBy("timestamp", "desc"), startAfter(lastVisible), limit(limitCount));
        } else {
            q = query(postCollectionRef, orderBy("timestamp", "desc"), limit(limitCount));
        }

        const querySnapshot = await getDocs(q);
        const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

        const posts = [];
        querySnapshot.forEach((doc) => {
            posts.push({ ...doc.data(), id: doc.id });
        });

        response = { posts, lastVisible: lastVisibleDoc };

    } catch (error) {
        console.error("hata: ", error);
    } finally {
        return response;
    }
}


// insert a document to message collection

async function insertDocument(data) {

    let docId = null;

    try {

        const docRef = await addDoc(postCollectionRef, data);

        docId = docRef.id;

    } catch (error) {

        return error.message;

    } finally { return docId; }
}


async function updateDocument(docId, data) {

    var response = false;

    try {

        const docRef = doc(postCollectionRef, docId);

        await updateDoc(docRef, data);
        response = true;

    } catch (error) {

        response = error.message;

    } finally { return response; }
}


async function deleteDocument(docId) {

    var response = null;

    try {

        const docRef = doc(postCollectionRef, docId);

        await deleteDoc(docRef);

    } catch (error) {

        response = error.message;

    } finally { return response; }
}


async function getDocumentById(docId) {

    var response = null;

    try {

        const docRef = doc(postCollectionRef, docId);

        const docSnapshot = await getDoc(docRef);

        if (docSnapshot.exists()) {
            response = { ...docSnapshot.data(), id: docSnapshot.id };
        }

        else { response = null; }

    } catch (error) {

        response = error.message;

    } finally { return response; }
}

export {

    getDocumentById, // get a document from post collection

    getAllDocuments, // get all documents from post collection

    getPaginatedPosts, // get paginated posts

    getAllDocumentsIds, // get all documents ids from post collection

    insertDocument, // insert a document to post collection

    updateDocument, // update a document in post collection

    deleteDocument, // delete a document from post collection

};