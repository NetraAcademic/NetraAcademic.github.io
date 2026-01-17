import { auth, db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  updateDoc,   
  doc,         
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { uploadArticleFile, getArticleFileUrl } from "./upload.js";

const form = document.getElementById("article-form");
const textarea = document.getElementById("content");
const counter = document.getElementById("char-counter")
const maxChars = 3000

const fileInput = document.getElementById("file");
const fileStatus = document.getElementById("file-status");
const removeFileBtn = document.getElementById("remove-file-btn");

fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
        fileStatus.textContent = `Dosya yüklendi: ${fileInput.files[0].name}`;
        removeFileBtn.style.display = "inline";
    } else {
        fileStatus.textContent = "";
        removeFileBtn.style.display = "none"; 
    }
});

removeFileBtn.addEventListener("click", () => {
    fileInput.value = "";
    fileStatus.textContent = "";
    removeFileBtn.style.display = "none";
});

form.addEventListener("submit", () => {
    fileInput.value = "";
    fileStatus.textContent = "";
    removeFileBtn.style.display = "none";
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
        const file = document.getElementById("file").files[0];

        if (!title || !content) {
          alert("Title and content are required.");
          return;
        }
    
        try {
          const docRef = await addDoc(collection(db, "articles"), {
            title,
            content,
            authorUid: user.uid,
            authorName: user.displayName || "",
            createdAt: serverTimestamp(),
            status: "pending"
          });
      
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
