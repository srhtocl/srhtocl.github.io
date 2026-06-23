export async function getVisitorMetadata() {
    // Sadece güvenli ve onay gerektirmeyen verileri toplar
    try {
        const ua = navigator.userAgent;
        
        // 1. İşletim Sistemi Tespiti
        let os = "Bilinmeyen OS";
        if (ua.indexOf("Win") !== -1) os = "Windows";
        if (ua.indexOf("Mac") !== -1) os = "MacOS";
        if (ua.indexOf("Linux") !== -1) os = "Linux";
        if (ua.indexOf("Android") !== -1) os = "Android";
        if (ua.indexOf("like Mac") !== -1) os = "iOS";

        // 2. Tarayıcı Tespiti
        let browser = "Bilinmiyor";
        if (ua.includes("Instagram")) browser = "Instagram App";
        else if (ua.includes("FBAN") || ua.includes("FBAV")) browser = "Facebook App";
        else if (ua.includes("Twitter")) browser = "Twitter App";
        else if (ua.includes("SamsungBrowser")) browser = "Samsung Internet";
        else if (ua.includes("Edg") || ua.includes("Edge")) browser = "Edge";
        else if (ua.includes("OPR") || ua.includes("Opera")) browser = "Opera";
        else if (ua.includes("MiuiBrowser")) browser = "Mi Browser";
        else if (ua.includes("Firefox") || ua.includes("FxiOS")) browser = "Firefox";
        else if (ua.includes("Chrome") || ua.includes("CriOS")) browser = "Chrome";
        else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";

        // 3. Cihaz Türü
        let deviceType = "Masaüstü";
        if (/Mobi|Android/i.test(ua)) deviceType = "Mobil";
        if (/Tablet|iPad/i.test(ua)) deviceType = "Tablet";

        // 4. Donanım (Onaysız)
        const cpuCores = navigator.hardwareConcurrency || "Bilinmiyor";
        const memory = navigator.deviceMemory || "Bilinmiyor";
        const screen = `${window.screen.width}x${window.screen.height}`;

        // 5. Ayarlar ve Dil
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Bilinmiyor";
        const language = navigator.language || navigator.userLanguage || "tr-TR";

        // 6. Ağ Durumu
        let network = "Bilinmiyor";
        if (navigator.connection) {
            network = `${navigator.connection.effectiveType ? navigator.connection.effectiveType.toUpperCase() : ''} ${navigator.connection.downlink ? `(${navigator.connection.downlink}Mbps)` : ''}`.trim();
        }

        // 7. Geliş Kaynağı (Referrer)
        let referrer = document.referrer || "Doğrudan URL";
        if (referrer && referrer.length > 50) referrer = referrer.substring(0, 50) + "...";

        // 8. Pil Durumu (Destekleyen tarayıcılarda onaysızdır)
        let batteryInfo = "Bilinmiyor";
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                const level = Math.round(battery.level * 100);
                const isCharging = battery.charging ? "⚡ Şarjda" : "🔋 Pilde";
                batteryInfo = `%${level} - ${isCharging}`;
            } catch (e) {
                // Ignore error
            }
        }

        // 9. IP tabanlı Kaba Konum (Ücretsiz API - Onay gerektirmez)
        let location = "Bilinmiyor";
        let isp = "Bilinmiyor";
        try {
            // ipapi.co json formatında hızlı ve ücretsiz döner
            const ipRes = await fetch('https://ipapi.co/json/');
            if (ipRes.ok) {
                const ipData = await ipRes.json();
                if (ipData.city) {
                    location = `${ipData.city}, ${ipData.region || ''}, ${ipData.country_name || ''}`.replace(/,\s*,/g, ',');
                    isp = ipData.org || ipData.asn || "Bilinmiyor";
                }
            }
        } catch (e) {
            // Adblocker vs. engellemiş olabilir, ignore
        }

        return {
            os,
            browser,
            deviceType,
            cpuCores,
            memory,
            screen,
            language,
            timeZone,
            network,
            battery: batteryInfo,
            referrer,
            location,
            isp,
            lastUpdate: new Date().toISOString()
        };
    } catch (error) {
        console.error("Telemetry hatası:", error);
        return null;
    }
}
