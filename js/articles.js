import { db } from "./firebase-config.js";
import { collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";



const articlesList = document.getElementById("articles-list");

async function loadApprovedArticles() {
    try {
        const q = query(
            collection(db, "articles"),
            where("status", "==", "approved"),
            orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        articlesList.innerHTML = "";

        querySnapshot.forEach((docSnap) => {
            const article = docSnap.data();

            const div = document.createElement("div");
            div.classList.add("article-card");

            div.innerHTML = `
                <h3>${article.title}</h3>
                <p class="article-meta">
                    By ${article.authorName} | ${article.createdAt?.toDate().toLocaleString() || ""}
                </p>
                <p class="article-preview">
                    ${article.content.substring(0, 200)}${article.content.length > 200 ? "..." : ""}
                </p>
            `;            

            // Tüm kart tıklanabilir olsun
            div.onclick = () => {
                window.location.href = `article.html?id=${docSnap.id}`;
            };
            






            articlesList.appendChild(div);
        });
    } catch (err) {
        console.error("Articles çekilemedi:", err);
        articlesList.innerHTML = "<p>Articles yüklenemedi: " + err.message + "</p>";
    }
}



// Sayfa açıldığında yükle
loadApprovedArticles();
