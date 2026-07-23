import React from 'react';
import { Suspense } from 'react';

/**
 * Lazy loading fallback — tam ekran spinner.
 * Bir sayfanın JS chunk'ı indirilirken gösterilir.
 */
export const LoadingScreen = () => (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
    </div>
);

/**
 * Kod Bölme (Code-Splitting) ve Tembel Yükleme (Lazy Loading) sarmalayıcısı.
 * Bir bileşeni parametre olarak alır ve React.Suspense ile sarar.
 * Suspense, lazy bileşen yüklenirken LoadingScreen gösterir.
 * Bu yapı, her sayfanın kodunun sadece o sayfaya gidildiğinde indirilmesini sağlar.
 *
 * @param {React.LazyExoticComponent} Component - React.lazy() ile sarmalanmış bileşen
 * @returns {JSX.Element}
 */
// eslint-disable-next-line no-unused-vars
export const Loadable = (Component) => (
    <Suspense fallback={<LoadingScreen />}>
        <Component />
    </Suspense>
);
