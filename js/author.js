import { auth, db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  updateDoc,   
  doc,         
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { uploadArticleFile, getArticleFileUrl } from "./upload.js";

const form = document.getElementById("article-form");
const keywordsInput = document.getElementById("keywords");
const textarea = document.getElementById("content");
const counter = document.getElementById("char-counter")
const maxChars = 3000
const maxFileSize = 20 * 1024 * 1024;

const fileInput = document.getElementById("file");
const fileStatus = document.getElementById("file-status");

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (file && file.size > maxFileSize) {
    fileInput.value = "";
    fileStatus.textContent = "This file exceeds the 20 MB limit. Please choose a smaller PDF.";
    fileStatus.classList.add("show");
  } else if (file) {
    fileStatus.textContent = `Dosya yüklendi: ${file.name}`;
    fileStatus.classList.add("show");
    } else {
        fileStatus.textContent = "";
    fileStatus.classList.remove("show");
    }
});

form.addEventListener("submit", () => {
    fileStatus.textContent = "";
});

textarea.addEventListener("input", () => {
    counter.textContent = `${textarea.value.length} / ${maxChars}`;
});

onAuthStateChanged(auth, (user) => {
    if (!user) {
        alert("You must log in to submit a post.");
        window.location.href = "index.html";
        return;
    }

form.onsubmit = async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();
  const rawKeywords = document.getElementById("keywords").value;
  const file = document.getElementById("file").files[0];

  if (!title || !content) {
    alert("Title and content are required.");
    return;
  }

  if (file && file.size > maxFileSize) {
    fileStatus.textContent = "This file exceeds the 20 MB limit. Please choose a smaller PDF.";
    fileStatus.classList.add("show");
    return;
  }

  // ===== KEYWORDS PARSE =====
  const keywords = rawKeywords
    .split(",")
    .map(k => k.trim().toLowerCase())
    .filter(k => k.length > 0);

  try {
    const profileSnap = await getDoc(doc(db, "users", user.uid));
    const profile = profileSnap.exists() ? profileSnap.data() : {};

    // ===== CREATE ARTICLE =====
    const docRef = await addDoc(collection(db, "articles"), {
      title,
      content,
      keywords,              // 👈 KEYWORDS KAYDEDİLİYOR
      authorUid: user.uid,
      authorName: profile.displayName || user.displayName || "",
      authorPhotoURL: profile.photoURL || user.photoURL || "",
      createdAt: serverTimestamp(),
      status: "pending"
    });

    // ===== FILE UPLOAD =====
    if (file) {
      const filePath = await uploadArticleFile(docRef.id, file);
      const fileUrl = getArticleFileUrl(filePath);

      await updateDoc(
        doc(db, "articles", docRef.id),
        { fileUrl }
      );
    }

    alert("Your post has been submitted successfully!");
    form.reset();
    counter.textContent = `0 / ${maxChars}`;

  } catch (err) {
    console.error(err);
    alert("Submission failed: " + err.message);
  }
};
});
