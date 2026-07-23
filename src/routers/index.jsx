import React from "react";
import { createHashRouter } from "react-router-dom";
import ProtectedRoute from "./protected-route";
import { Loadable } from "./loadable";

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
const EditProfile = React.lazy(() => import("../pages/edit-profile"));
const Gallery = React.lazy(() => import("../pages/gallery"));
const ManageCategories = React.lazy(() => import("../pages/manage-categories"));
const Archive = React.lazy(() => import("../pages/archive"));


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
                handle: { title: "Ana Sayfa" }
            },
            {
                path: "/message",
                element: Loadable(Message),
                handle: { title: "Mesaj Gönder" }
            },

            {
                path: "/login",
                element: Loadable(Login),
                handle: { title: "Giriş Yap" }
            },

            // Protected Routes with Layout
            {
                element: <ProtectedRoute />,
                children: [
                    {
                        path: "/all-messages",
                        element: Loadable(AllMessage),
                        handle: { title: "Mesajlar" }
                    },
                    {
                        path: "/create-post",
                        element: Loadable(CreatePost),
                        handle: { title: "Yeni Gönderi" }
                    },
                    {
                        path: "/posts",
                        element: Loadable(AllPosts),

                        handle: { title: "Gönderiler" }
                    },
                    {
                        path: "/gallery",
                        element: Loadable(Gallery),
                        handle: { title: "Galeri" }
                    },
                    {
                        path: "/edit-profile",
                        element: Loadable(EditProfile),
                        handle: { title: "Profili Düzenle" }
                    },
                    {
                        path: "/manage-categories",
                        element: Loadable(ManageCategories),
                        handle: { title: "Kategorileri Yönet" }
                    },
                    {
                        path: "/archive",
                        element: Loadable(Archive),
                        handle: { title: "Arşiv" }
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
                handle: { title: "Cevap Yaz" }
            }
        ]
    }
]);

export default router;
