import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const articleId = params.get("id");

const titleEl = document.getElementById("article-title");
const metaEl = document.getElementById("article-meta");
const contentEl = document.getElementById("article-content");

async function loadArticle() {
  if (!articleId) {
    titleEl.textContent = "Article not found";
    return;
  }

  try {
    const docRef = doc(db, "articles", articleId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      titleEl.textContent = "Article not found";
      return;
    }

    const article = docSnap.data();

    titleEl.textContent = article.title || "";
    metaEl.textContent = `By ${article.authorName || ""} | ${
      article.createdAt?.toDate().toLocaleString() || ""
    }`;

    let html = "";

    if (article.content) {
      html += `<p>${article.content.replace(/\n/g, "<br>")}</p>`;
    }

    if (article.fileUrl) {
      html += `

        <p>
           <a href="${article.fileUrl}" target="_blank">
            View Article File (PDF)
          </a>
        </p>
      `;
    }

    contentEl.innerHTML = html || "<p>Content not found.</p>";

  } catch (err) {
    titleEl.textContent = "Article could not be uploaded.";
    contentEl.textContent = err.message;
  }
}

loadArticle();
