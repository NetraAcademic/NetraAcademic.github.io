import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// URL parametresinden article ID al
const params = new URLSearchParams(window.location.search);
const articleId = params.get("id");

const titleEl = document.getElementById("article-title");
const metaEl = document.getElementById("article-meta");
const contentEl = document.getElementById("article-content");

async function loadArticle() {
  if (!articleId) {
    titleEl.textContent = "Makale bulunamadı";
    return;
  }

  try {
    const docRef = doc(db, "articles", articleId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const article = docSnap.data();
      titleEl.textContent = article.title;
      metaEl.textContent = `By ${article.authorName} | ${article.createdAt?.toDate().toLocaleString() || ""}`;
      contentEl.innerHTML = `<p>${article.content.replace(/\n/g, "<br>")}</p>`;
    } else {
      titleEl.textContent = "Makale bulunamadı";
    }
  } catch (err) {
    titleEl.textContent = "Makale yüklenemedi";
    contentEl.textContent = err.message;
  }
}

loadArticle();
