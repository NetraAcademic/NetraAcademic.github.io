import { db } from "./firebase-config.js";
import { collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { deleteDoc, doc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";


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
                <button class="delete-btn">Sil</button>
            `;            

            // Tüm kart tıklanabilir olsun
            div.onclick = () => {
                window.location.href = `article.html?id=${docSnap.id}`;
            };
            
            const deleteBtn = div.querySelector(".delete-btn");
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                deleteArticle(docSnap.id);
            };





            articlesList.appendChild(div);
        });
    } catch (err) {
        console.error("Articles çekilemedi:", err);
        articlesList.innerHTML = "<p>Articles yüklenemedi: " + err.message + "</p>";
    }
}

    window.deleteArticle = async function (id) {
        if (!confirm("Bu yazıyı silmek istiyor musun?")) return;

        try {
            await deleteDoc(doc(db, "articles", id));
            alert("Yazı silindi");
            loadApprovedArticles(); // listeyi yenile
        } catch (err) {
            alert("Silme hatası: " + err.message);
        }
    };

// Sayfa açıldığında yükle
loadApprovedArticles();
