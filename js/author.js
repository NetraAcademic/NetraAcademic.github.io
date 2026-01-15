import { auth, db, storage } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("article-form");
    const editor = document.getElementById("content");          // ✅ DOM
    const counter = document.getElementById("char-counter");
    const maxChars = 3000;
    

    if (!form || !editor || !counter) {
        console.error("Gerekli elemanlar bulunamadı");
        return;
    }

    /* Toolbar */
    document.querySelectorAll(".editor-toolbar button").forEach(btn => {
        btn.addEventListener("click", () => {
            document.execCommand(btn.dataset.cmd, false, null);
            editor.focus();
        });
    });

    /* Karakter sayacı */
    editor.addEventListener("input", () => {
        const len = editor.innerText.length;

        if (len > maxChars) {
            editor.innerText = editor.innerText.substring(0, maxChars);
            placeCaretAtEnd(editor);
        }

        counter.textContent = `${editor.innerText.length} / ${maxChars}`;
        counter.style.color =
            len > maxChars * 0.9 ? "#f44336" : "var(--text-muted)";
    });

    onAuthStateChanged(auth, (user) => {
        if (!user) {
            alert("Yazı göndermek için giriş yapmalısınız.");
            window.location.href = "index.html";
            return;
        }

        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const title = document.getElementById("title").value.trim();
            const contentHTML = editor.innerHTML.trim(); // ✅ HTML olarak
            const fileInput = document.getElementById("file");
            const file = fileInput.files[0];
            let fileUrl = null;

            if (!title || !editor.innerText.trim()) {
                return alert("Başlık ve içerik gerekli.");
            }

            if (file) {
                const allowedTypes = [
                    "image/jpeg",
                    "image/png",
                    "image/jpg",
                    "application/pdf"
                ];

                if (!allowedTypes.includes(file.type)) {
                    return alert("Invalid file format (.png, .jpg, .jpeg, .pdf)");
                }

                if (file.size > 5 * 1024 * 1024) {
                    return alert("File can't be bigger than 5MB");
                }

                const fileRef = ref(
                    storage,
                    `articles/${user.uid}/${crypto.randomUUID()}_${file.name}`
                );

                await uploadBytes(fileRef, file);
                fileUrl = await getDownloadURL(fileRef);
            }

            try {
                await addDoc(collection(db, "articles"), {
                    title,
                    content: contentHTML,     // ✅ HTML kaydediliyor
                    attachmentUrl: fileUrl,
                    attachmentName: file ? file.name : null,
                    authorUid: user.uid,
                    authorName: user.displayName || "",
                    createdAt: serverTimestamp(),
                    status: "pending"
                });

                alert("Yazınız başarıyla gönderildi!");
                form.reset();
                editor.innerHTML = "";
                counter.textContent = `0 / ${maxChars}`;

            } catch (err) {
                console.error("Yazı gönderilemedi:", err);
                alert("Yazı gönderilemedi: " + err.message);
            }
        });
    });
});

/* İmleci sona taşı */
function placeCaretAtEnd(el) {
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
}
