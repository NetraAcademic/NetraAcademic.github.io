import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/**
 * checkRole([allowedRoles])
 * allowedRoles: array of strings, örn: ["admin"], ["author", "editor"]
 * Eğer kullanıcı yetkili değilse redirect olur
 */
export function checkRole(allowedRoles = []) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            // Oturum yok → home sayfasına yönlendir
            window.location.href = "index.html";
            return;
        }

        try {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                window.location.href = "index.html";
                return;
            }

            const role = docSnap.data().role;

            if (!allowedRoles.includes(role)) {
                alert("Bu sayfaya erişim yetkiniz yok.");
                window.location.href = "index.html";
            }
        } catch (err) {
            console.error(err);
            window.location.href = "index.html";
        }
    });
}
