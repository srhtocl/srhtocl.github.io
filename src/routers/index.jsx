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
const EditProfile = React.lazy(() => import("../pages/edit-profile"));

// Loading Fallback
const LoadingScreen = () => (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
    </div>
);

// --- Kod Bölme (Code-Splitting) ve Tembel Yükleme (Lazy Loading) ---
// Loadable, bir bileşeni parametre olarak alan ve onu React.Suspense ile saran bir fonksiyondur (Higher-Order Component).
// Suspense, içine aldığı bileşenlerin (bu durumda lazy ile yüklenen sayfaların) yüklenmesini bekler.
// Yükleme sırasında, `fallback` prop'u olarak verilen `LoadingScreen` bileşenini ekranda gösterir.
// Bu yapı, her sayfanın kodunun sadece o sayfaya gidildiğinde indirilmesini sağlar,
// böylece uygulamanın başlangıç yükleme süresi kısalır ve performans artar.
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
                        path: "/edit-profile",
                        element: Loadable(EditProfile),
                        handle: { title: "Profili Düzenle" }
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
