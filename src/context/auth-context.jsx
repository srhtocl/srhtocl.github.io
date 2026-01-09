import React, { createContext, useContext, useState, useEffect } from 'react';

import { onAuthStateChanged } from 'firebase/auth';

import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";


const AuthContext = createContext();

export function AuthProvider({ children }) {

	const [user, setUser] = useState(null);

	const [loading, setLoading] = useState(true);

	const handleLogout = async () => {

		try {

			await signOut(auth).then(() => {

				setUser(null);

				setLoading(false);

				console.log("Çıkış başarılı.");
			});

		} catch (error) {

			console.error("Çıkış yapılırken bir hata oluştu:", error);
		}
	};

	const value = { user, setUser, loading, setLoading, handleLogout };

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser);
			setLoading(false);
		});
		return () => unsubscribe();
	}, []);

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() { return useContext(AuthContext); }




