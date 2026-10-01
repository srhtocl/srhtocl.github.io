// Firestore güvenlik kuralları testleri (chats koleksiyonu).
// Çalıştırmak için: npm run test:rules
// Firestore emülatörünü başlatır (Java gerektirir); gerçek projeye dokunmaz.
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, test } from "node:test";
import {
    assertFails,
    assertSucceeds,
    initializeTestEnvironment
} from "@firebase/rules-unit-testing";
import {
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc
} from "firebase/firestore";

const CHAT_ID = "a1b2c3d4e5f60718293a4b5c6d7e8f90";
const OTHER_ID = "ffffffffffffffffffffffffffffffff";

const msg = (user, data = "merhaba", time = Date.now()) => ({ user, time, data });

let env;

before(async () => {
    env = await initializeTestEnvironment({
        projectId: "demo-srhtocl",
        firestore: { rules: readFileSync("firestore.rules", "utf8") }
    });
});

after(async () => {
    await env?.cleanup();
});

beforeEach(async () => {
    await env.clearFirestore();
});

const visitorDb = () => env.unauthenticatedContext().firestore();
const adminDb = () => env.authenticatedContext("admin-uid", { admin: true }).firestore();
const userDb = () => env.authenticatedContext("random-uid").firestore();

// Kuralları atlayarak başlangıç verisi yazar.
const seedChat = (data) =>
    env.withSecurityRulesDisabled((ctx) =>
        setDoc(doc(ctx.firestore(), "chats", CHAT_ID), data)
    );

describe("chats: oluşturma", () => {
    test("ziyaretçi kendi kimliğiyle boş sohbet oluşturabilir", async () => {
        await assertSucceeds(
            setDoc(doc(visitorDb(), "chats", CHAT_ID), { user: CHAT_ID, messages: [] })
        );
    });

    test("doküman ID'si ile user alanı farklıysa reddedilir", async () => {
        await assertFails(
            setDoc(doc(visitorDb(), "chats", CHAT_ID), { user: OTHER_ID, messages: [] })
        );
    });

    test("tahmin edilebilir (zaman damgası) ID ile oluşturulamaz", async () => {
        const oldId = (1700000000000).toString(16);
        await assertFails(
            setDoc(doc(visitorDb(), "chats", oldId), { user: oldId, messages: [] })
        );
    });

    test("mesajlarla dolu sohbet oluşturulamaz", async () => {
        await assertFails(
            setDoc(doc(visitorDb(), "chats", CHAT_ID), {
                user: CHAT_ID,
                messages: [msg("admin")]
            })
        );
    });

    test("ekstra alanla (ör. fcmToken) oluşturulamaz", async () => {
        await assertFails(
            setDoc(doc(visitorDb(), "chats", CHAT_ID), {
                user: CHAT_ID,
                messages: [],
                fcmToken: "x"
            })
        );
    });
});

describe("chats: okuma", () => {
    test("ID'yi bilen tek sohbeti okuyabilir", async () => {
        await seedChat({ user: CHAT_ID, messages: [] });
        await assertSucceeds(getDoc(doc(visitorDb(), "chats", CHAT_ID)));
    });

    test("ziyaretçi tüm sohbetleri listeleyemez", async () => {
        await assertFails(getDocs(collection(visitorDb(), "chats")));
    });

    test("admin tüm sohbetleri listeleyebilir", async () => {
        await assertSucceeds(getDocs(collection(adminDb(), "chats")));
    });
});

describe("chats: ziyaretçi mesaj ekleme", () => {
    beforeEach(async () => {
        await seedChat({ user: CHAT_ID, messages: [msg(CHAT_ID, "ilk", 1700000000000)] });
    });

    // useChat'in gönderdiği biçim: arrayUnion + sunucu saatli spam damgası.
    const visitorAppend = (fields) =>
        updateDoc(doc(visitorDb(), "chats", CHAT_ID), {
            lastVisitorMessageAt: serverTimestamp(),
            ...fields
        });

    test("arrayUnion ile sona kendi mesajını ekleyebilir", async () => {
        await assertSucceeds(visitorAppend({ messages: arrayUnion(msg(CHAT_ID, "ikinci")) }));
    });

    test("spam damgası olmadan (eski istemci) mesaj ekleyemez", async () => {
        await assertFails(
            updateDoc(doc(visitorDb(), "chats", CHAT_ID), {
                messages: arrayUnion(msg(CHAT_ID, "ikinci"))
            })
        );
    });

    test("spam damgasını sunucu saati yerine kendisi seçemez", async () => {
        await assertFails(
            visitorAppend({
                messages: arrayUnion(msg(CHAT_ID, "ikinci")),
                lastVisitorMessageAt: Timestamp.fromMillis(Date.now() - 60000)
            })
        );
    });

    test("3 saniye dolmadan ikinci mesajı gönderemez", async () => {
        await assertSucceeds(visitorAppend({ messages: arrayUnion(msg(CHAT_ID, "bir")) }));
        await assertFails(visitorAppend({ messages: arrayUnion(msg(CHAT_ID, "iki")) }));
    });

    test("3 saniye geçtikten sonra tekrar gönderebilir", async () => {
        await seedChat({
            user: CHAT_ID,
            messages: [msg(CHAT_ID, "ilk")],
            lastVisitorMessageAt: Timestamp.fromMillis(Date.now() - 4000)
        });
        await assertSucceeds(visitorAppend({ messages: arrayUnion(msg(CHAT_ID, "iki")) }));
    });

    test("saati sunucudan 5 dakikadan fazla sapan mesajı ekleyemez", async () => {
        await assertFails(
            visitorAppend({ messages: arrayUnion(msg(CHAT_ID, "eski", Date.now() - 600000)) })
        );
        await assertFails(
            visitorAppend({ messages: arrayUnion(msg(CHAT_ID, "gelecek", Date.now() + 600000)) })
        );
    });

    test("sahte admin mesajı ekleyemez", async () => {
        await assertFails(visitorAppend({ messages: arrayUnion(msg("admin", "sahte")) }));
    });

    test("araya sahte admin mesajı sokup sona normal mesaj ekleyemez", async () => {
        await assertFails(
            visitorAppend({
                messages: [
                    msg(CHAT_ID, "ilk", 1700000000000),
                    msg("admin", "sahte"),
                    msg(CHAT_ID, "son")
                ]
            })
        );
    });

    test("başka bir ziyaretçi adına mesaj ekleyemez", async () => {
        await assertFails(visitorAppend({ messages: arrayUnion(msg(OTHER_ID, "başkası")) }));
    });

    test("geçmiş mesajları silemez", async () => {
        await assertFails(visitorAppend({ messages: [] }));
    });

    test("geçmiş mesajı değiştiremez", async () => {
        await assertFails(
            visitorAppend({
                messages: [msg(CHAT_ID, "değiştirildi", 1700000000000), msg(CHAT_ID, "yeni")]
            })
        );
    });

    test("aynı anda iki mesaj ekleyemez", async () => {
        const now = Date.now();
        await assertFails(
            visitorAppend({
                messages: arrayUnion(msg(CHAT_ID, "a", now), msg(CHAT_ID, "b", now + 1))
            })
        );
    });

    test("boş veya 2000 karakterden uzun mesaj ekleyemez", async () => {
        await assertFails(visitorAppend({ messages: arrayUnion(msg(CHAT_ID, "")) }));
        await assertFails(
            visitorAppend({ messages: arrayUnion(msg(CHAT_ID, "x".repeat(2001))) })
        );
    });

    test("mesaja ekstra alan ekleyemez", async () => {
        await assertFails(
            visitorAppend({ messages: arrayUnion({ ...msg(CHAT_ID, "x"), isAdmin: true }) })
        );
    });

    test("mesajla birlikte başka alan değiştiremez", async () => {
        await assertFails(
            visitorAppend({ messages: arrayUnion(msg(CHAT_ID, "x")), user: OTHER_ID })
        );
    });

    test("200 mesaj sınırını aşamaz", async () => {
        const full = Array.from({ length: 200 }, (_, i) => msg(CHAT_ID, "m", i));
        await seedChat({ user: CHAT_ID, messages: full });
        await assertFails(visitorAppend({ messages: arrayUnion(msg(CHAT_ID, "fazla")) }));
    });
});

describe("chats: diğer güncellemeler", () => {
    beforeEach(async () => {
        await seedChat({ user: CHAT_ID, messages: [msg(CHAT_ID, "ilk")] });
    });

    test("ziyaretçi bildirim tokenını kaydedebilir (merge)", async () => {
        await assertSucceeds(
            setDoc(
                doc(visitorDb(), "chats", CHAT_ID),
                { user: CHAT_ID, fcmToken: "token-123", tokenUpdatedAt: new Date() },
                { merge: true }
            )
        );
    });

    test("değişiklik içermeyen merge (useChat açılışı) kabul edilir", async () => {
        await assertSucceeds(
            setDoc(doc(visitorDb(), "chats", CHAT_ID), { user: CHAT_ID }, { merge: true })
        );
    });

    test("user alanı değiştirilemez", async () => {
        await assertFails(updateDoc(doc(visitorDb(), "chats", CHAT_ID), { user: OTHER_ID }));
    });

    test("rastgele alan eklenemez", async () => {
        await assertFails(
            updateDoc(doc(visitorDb(), "chats", CHAT_ID), { metadata: { os: "sahte" } })
        );
    });

    test("admin olmayan giriş yapmış kullanıcı admin mesajı ekleyemez", async () => {
        await assertFails(
            updateDoc(doc(userDb(), "chats", CHAT_ID), {
                messages: arrayUnion(msg("admin", "sahte"))
            })
        );
    });

    test("admin cevap ekleyebilir", async () => {
        await assertSucceeds(
            updateDoc(doc(adminDb(), "chats", CHAT_ID), {
                messages: arrayUnion(msg("admin", "cevap"))
            })
        );
    });
});

describe("chats: silme", () => {
    beforeEach(async () => {
        await seedChat({ user: CHAT_ID, messages: [] });
    });

    test("ziyaretçi silemez", async () => {
        await assertFails(deleteDoc(doc(visitorDb(), "chats", CHAT_ID)));
    });

    test("admin silebilir", async () => {
        await assertSucceeds(deleteDoc(doc(adminDb(), "chats", CHAT_ID)));
    });
});
