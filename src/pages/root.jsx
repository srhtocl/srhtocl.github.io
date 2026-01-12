import { Outlet } from "react-router-dom";
import React from "react";
import { Header } from "../components/header";
import BottomNav from "../components/bottom-nav";
import { useAuth } from "../context/auth-context";
import { Toaster } from "react-hot-toast";

import ScrollToTop from "../components/scroll-to-top";

export default function Root() {
	const authContext = useAuth();

	return (
		<React.Fragment>
			<ScrollToTop />
			<Header />
			<Toaster position="top-center" toastOptions={{ duration: 3000 }} />

			<main id="main" className={`flex flex-col w-screen h-screen overflow-hidden ${authContext.user ? 'pt-16 pb-16' : ''}`}>
				<Outlet />
			</main>

			<BottomNav />

		</React.Fragment>
	);
}