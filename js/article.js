import { db } from "./firebase-config.js";
import { doc, getDoc, collection, addDoc, query, where, getDocs, orderBy, serverTimestamp} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

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
const auth = getAuth();
const defaultAvatar = "assets/logo.png";

let currentUser = null;

function formatTimestamp(value) {
  if (!value) return "";
  const date = typeof value.toDate === "function"
    ? value.toDate()
    : value instanceof Date
      ? value
      : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[character]));
}

async function getAuthorProfile(uid, fallback = {}) {
  if (!uid) return fallback;

  const profileSnap = await getDoc(doc(db, "users", uid));
  return profileSnap.exists() ? { ...fallback, ...profileSnap.data() } : fallback;
}

function renderAuthor(author, label = "") {
  const name = author.displayName || author.authorName || author.email || "Anonymous";
  const avatar = author.photoURL || author.authorPhotoURL || defaultAvatar;
  const authorMarkup = author.uid || author.authorUid || author.authorId
    ? `<a class="author-link" href="profile.html?id=${encodeURIComponent(author.uid || author.authorUid || author.authorId)}">
        <img class="author-avatar" src="${escapeHtml(avatar)}" alt="${escapeHtml(name)} avatar">
        <span>${escapeHtml(name)}</span>
      </a>`
    : `<span class="author-link"><img class="author-avatar" src="${escapeHtml(avatar)}" alt="Anonymous avatar"><span>${escapeHtml(name)}</span></span>`;

  return `${label}${authorMarkup}`;
}

onAuthStateChanged(auth, (user) => {
  currentUser = user; // login varsa user, yoksa null
});


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
    const author = await getAuthorProfile(article.authorUid, article);
    metaEl.innerHTML = `${renderAuthor({ ...author, uid: article.authorUid }, "By ")} | ${formatTimestamp(article.createdAt)}`;

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

  const comments = await Promise.all(snapshot.docs.map(async (commentDoc) => {
    const data = commentDoc.data();
    const author = await getAuthorProfile(data.authorId, data);
    return `
      <div class="comment">
        <p>${escapeHtml(data.text)}</p>
        <small>
          ${formatTimestamp(data.createdAt)} •
          ${renderAuthor({ ...author, uid: data.authorId })}
        </small>
      </div>
    `;
  }));
  commentsList.innerHTML = comments.join("");
}

const commentForm = document.querySelector("#comment-section form");

commentForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const input = document.getElementById("comment-input");
  const text = input.value.trim();
  if (!text || !articleId) return;

const profileSnap = currentUser
  ? await getDoc(doc(db, "users", currentUser.uid))
  : null;
const profile = profileSnap?.exists() ? profileSnap.data() : {};

await addDoc(collection(db, "comments"), {
  articleId,
  text,
  authorId: currentUser ? currentUser.uid : null,
  authorName: currentUser
    ? (profile.displayName || currentUser.displayName || currentUser.email)
    : "Anonymous",
  authorPhotoURL: currentUser ? (profile.photoURL || currentUser.photoURL || "") : "",
  createdAt: serverTimestamp()
});

  input.value = "";
  loadComments();
});
loadComments()
