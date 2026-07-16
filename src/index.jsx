import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, } from "react-router-dom";
import router from './routers';
import { AuthProvider } from "./context/auth-context";
import { ProfileProvider } from "./context/profile-context";

import "./styles/main.css"

ReactDOM.createRoot(document.getElementById('root')).render(

	<AuthProvider>
		<ProfileProvider>
			<RouterProvider router={router} />
		</ProfileProvider>
	</AuthProvider>

);