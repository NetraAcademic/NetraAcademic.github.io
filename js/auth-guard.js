import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";


export function checkRole(allowedRoles = []) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
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
                alert("You do not have permission to access this page.");
                window.location.href = "index.html";
            }
        } catch (err) {
            console.error(err);
            window.location.href = "index.html";
        }
    });
}
