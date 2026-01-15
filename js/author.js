import { auth, db } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

const form = document.getElementById("article-form");
const textarea = document.getElementById("content");
const counter = document.getElementById("char-counter")
const maxChars = 3000

textarea.addEventListener("input", () => {
    counter.textContent = `${textarea.value.length} / ${maxChars}`;
});

onAuthStateChanged(auth, (user) => {
    if (!user) {
        alert("Yazı göndermek için giriş yapmalısınız.");
        window.location.href = "index.html";
        return;
    }

    form.onsubmit = async (e) => {
        e.preventDefault();
        const title = document.getElementById("title").value.trim();
        const content = document.getElementById("content").value.trim();

        if (!title || !content) return alert("Başlık ve içerik gerekli.");

        try {
            await addDoc(collection(db, "articles"), {
                title,
                content,
                authorUid: user.uid,
                authorName: user.displayName || "",
                createdAt: serverTimestamp(),
                status: "pending" // başlangıçta pending
            });
            alert("Yazınız başarıyla gönderildi!");
            form.reset();
        } catch (err) {
            console.error("Yazı gönderilemedi:", err);
            alert("Yazı gönderilemedi: " + err.message);
        }
    };
});
