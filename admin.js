import { db } from "./firebase-config.js";
import { collection, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const tbody = document.querySelector("#user-table tbody");
const roles = ["reader", "author", "editor", "admin"]; 

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
                <td><button data-uid="${user.uid}">Update Role</button></td>
            `;
            
            tbody.appendChild(tr);

            const select = tr.querySelector("select");
            const btn = tr.querySelector("button");

            btn.onclick = async () => {
                const newRole = select.value;
                try {
                    await updateDoc(doc(db, "users", user.uid), { role: newRole });
                    alert(`${user.displayName}'s role has been updated to ${newRole}!`);
                    loadUsers();
                } catch (err) {
                    console.error("Role could not be updated:", err);
                    alert("Role could not be updated: " + err.message);
                }
            };
        });
    } catch (err) {
        console.error("Users could not be retrieved:", err);
        alert("Users could not be retrieved: " + err.message);
    }
}

loadUsers();
