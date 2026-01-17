/**
 * @file auth-context.jsx
 * @description Uygulama genelinde kullanıcı oturum durumunu (User Session) yöneten Context.
 * Auth verisini sağlar ve oturum açma/kapama durumlarını dinler.
 * 
 * @dependencies
 * - src/services/auth-service.js (Firebase Auth işlemleri)
 * 
 * @date 2026-01-18
 * @author [AI Assistant]
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscribeToAuthChanges, logoutUser } from '../services/auth-service';

const AuthContext = createContext();

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	const handleLogout = async () => {
		try {
			await logoutUser();
			setUser(null);
			// setLoading(false) gereksiz olabilir çünkü onAuthStateChanged zaten tetiklenecek
			// ama güvenli tarafta kalmak için state update yapılabilir.
		} catch (error) {
			console.error("Çıkış hatası:", error);
		}
	};

	useEffect(() => {
		// Servis katmanından dinleyiciyi başlat
		const unsubscribe = subscribeToAuthChanges((currentUser) => {
			setUser(currentUser);
			setLoading(false);
		});

		// Cleanup
		return () => unsubscribe();
	}, []);

	const value = { user, setUser, loading, setLoading, handleLogout };

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() { return useContext(AuthContext); }




