import { db } from "./firebase-config.js";
import { collection, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const tbody = document.querySelector("#user-table tbody");
const roles = ["reader", "author", "editor", "admin"]; // banned kaldırıldı

export async function loadUsers() {
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        tbody.innerHTML = "";

        querySnapshot.forEach((userDoc) => {
            const user = userDoc.data();
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${user.uid}</td>
                <td>${user.displayName || ""}</td>
                <td>${user.email || ""}</td>
                <td>
                    <select data-uid="${user.uid}">
                        ${roles.map(r => `<option value="${r}" ${user.role === r ? "selected" : ""}>${r}</option>`).join("")}
                    </select>
                </td>
                <td><button data-uid="${user.uid}">Güncelle</button></td>
            `;
            
            tbody.appendChild(tr);

            const select = tr.querySelector("select");
            const btn = tr.querySelector("button");

            btn.onclick = async () => {
                const newRole = select.value;
                try {
                    await updateDoc(doc(db, "users", user.uid), { role: newRole });
                    alert(`${user.displayName} rolü "${newRole}" olarak güncellendi!`);
                    loadUsers();
                } catch (err) {
                    console.error("Rol güncellenemedi:", err);
                    alert("Rol güncellenemedi: " + err.message);
                }
            };
        });
    } catch (err) {
        console.error("Kullanıcılar çekilemedi:", err);
        alert("Kullanıcılar çekilemedi: " + err.message);
    }
}

loadUsers();
