import { db } from "./firebase-config.js";
import { collection, query, where, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const tbody = document.querySelector("#pending-articles-table tbody");

async function loadPendingArticles() {
    try {
        const q = query(
            collection(db, "articles"),
            where("status", "==", "pending")
        );

        const querySnapshot = await getDocs(q);
        tbody.innerHTML = "";

        querySnapshot.forEach((docSnap) => {
            const article = docSnap.data();
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td><a href="article.html?id=${docSnap.id}">${article.title}</a></td>
                <td>${article.authorName}</td>
                <td>${article.createdAt?.toDate().toLocaleString() || ""}</td>
                <td>
                    <button class="approve-btn" data-id="${docSnap.id}">Approve</button>
                    <button class="reject-btn" data-id="${docSnap.id}">Reject</button>
                </td>
            `;

            // Approve butonu
            tr.querySelector(".approve-btn").onclick = async () => {
                try {
                    await updateDoc(doc(db, "articles", docSnap.id), { status: "approved" });
                    tr.remove(); // tablo güncelle
                } catch (err) {
                    alert("Approve işlemi başarısız: " + err.message);
                }
            };

            // Reject butonu
            tr.querySelector(".reject-btn").onclick = async () => {
                try {
                    await updateDoc(doc(db, "articles", docSnap.id), { status: "rejected" });
                    tr.remove(); // tablo güncelle
                } catch (err) {
                    alert("Reject işlemi başarısız: " + err.message);
                }
            };

            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Pending articles çekilemedi:", err);
        alert("Pending articles çekilemedi: " + err.message);
    }
}

loadPendingArticles();
