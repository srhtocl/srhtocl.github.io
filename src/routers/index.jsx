import React, { Suspense } from "react";
import { createHashRouter } from "react-router-dom";
import ProtectedRoute from "./protected-route";

// Lazy Load Components
const Root = React.lazy(() => import("../pages/root"));
const Home = React.lazy(() => import("../pages/home"));
const Message = React.lazy(() => import("../pages/message"));
const ErrorPage = React.lazy(() => import("../pages/error-page"));
const Response = React.lazy(() => import("../pages/response"));
const AllMessage = React.lazy(() => import("../pages/messages"));
const Login = React.lazy(() => import("../auth/login"));
const CreatePost = React.lazy(() => import("../pages/create-post"));
const AllPosts = React.lazy(() => import("../pages/read-post"));

// Loading Fallback
const LoadingScreen = () => (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
    </div>
);

const Loadable = (Component) => (
    <Suspense fallback={<LoadingScreen />}>
        <Component />
    </Suspense>
);

const router = createHashRouter([
    {
        path: "/",
        element: Loadable(Root),
        errorElement: Loadable(ErrorPage),
        children: [
            // Public Routes
            {
                index: true,
                element: Loadable(Home),
            },
            {
                path: "/message",
                element: Loadable(Message),
            },

            {
                path: "/login",
                element: Loadable(Login),
            },

            // Protected Routes with Layout
            {
                element: <ProtectedRoute />,
                children: [
                    {
                        path: "/all-messages",
                        element: Loadable(AllMessage),
                    },
                    {
                        path: "/create-post",
                        element: Loadable(CreatePost),
                    },
                    {
                        path: "/posts",
                        element: Loadable(AllPosts),
                    }
                ]
            }
        ]
    },
    // Protected Routes WITHOUT Layout (No Header/Footer)
    {
        element: <ProtectedRoute />,
        children: [
            {
                path: "/response/:userid",
                element: Loadable(Response),
            }
        ]
    }
]);

export default router;
