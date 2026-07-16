/**
 * @file telemetry.js
 * @description Telemetri özelliği kullanıcı gizliliği nedeniyle devre dışı bırakıldı.
 * Ziyaretçilerden rıza alınmadan veri toplanmamalıdır.
 * @deprecated Bu modül kullanılmamaktadır.
 */

// Telemetri özelliği kaldırıldı.
// Geçmiş: Ziyaretçi OS, tarayıcı, konum ve donanım verisi toplanıyordu.
// Sebep: KVKK kapsamında açık rıza gerektiren veri toplama yapılıyordu.
export async function getVisitorMetadata() {
    return null;
}
