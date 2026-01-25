import { db } from "./firebase-config.js";
import { doc, getDoc, collection, addDoc, query, where, getDocs, orderBy, serverTimestamp} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const articleId = params.get("id");

const pageTitle = document.getElementById("page-title");
const titleEl = document.getElementById("article-title");
const metaEl = document.getElementById("article-meta");
const contentEl = document.getElementById("article-content");
const metaTitle = document.getElementById("meta-title");
const metaDescription = document.getElementById("meta-description");
const metaKeywords = document.getElementById("meta-keywords");
const ogTitle = document.getElementById("og-title");
const ogDescription = document.getElementById("og-description");
const canonical = document.getElementById("canonical-url");
const commentsList = document.getElementById("comments-list")



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

    console.log("KEYWORDS:", article.keywords);
    
    // ===== META TAGS =====
    metaTitle.textContent = article.title || "Article";
    document.title = article.title || "Article";

    metaDescription.setAttribute(
      "content",
      article.content
        ? article.content.substring(0, 150)
        : ""
    );

    metaKeywords.setAttribute(
      "content",
      Array.isArray(article.keywords)
        ? article.keywords.join(", ")
        : ""
    );

    ogTitle.setAttribute("content", article.title || "");
    ogDescription.setAttribute(
      "content",
      article.content
        ? article.content.substring(0, 150)
        : ""
    );

    canonical.setAttribute(
      "href",
      `https://siteadi.com/article.html?id=${articleId}`
    );

    pageTitle.textContent = article.title || "";
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

async function loadComments() {
  if (!articleId) return;

  const q = query(
    collection(db, "comments"),
    where("articleId", "==", articleId),
    orderBy("createdAt", "asc")
  );

  const snapshot = await getDocs(q);
  commentsList.innerHTML = "";

  snapshot.forEach(doc => {
    const data = doc.data();
    commentsList.innerHTML += `
      <div class="comment">
        <p>${data.text}</p>
        <small>${data.createdAt?.toDate().toLocaleString() || ""}</small>
      </div>
    `;
  });
}

const commentForm = document.querySelector("#comment-section form");

commentForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const input = document.getElementById("comment-input");
  const text = input.value.trim();
  if (!text || !articleId) return;

  await addDoc(collection(db, "comments"), {
    articleId,
    text,
    createdAt: serverTimestamp()
  });

  input.value = "";
  loadComments();
});
loadComments()
