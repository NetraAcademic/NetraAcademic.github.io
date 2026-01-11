import { auth, provider, db } from "./firebase-config.js";
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// Navbar sol ve sağ
const navLeft = document.querySelector(".nav-left");
const navRight = document.querySelector(".nav-right");

// Google login
export async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Firestore'da kullanıcı kontrolü
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        if(!docSnap.exists()){
            // Yeni kullanıcı → default role = "author" + UID ekle
            await setDoc(userRef, {
                uid: user.uid,                 // <-- UID burada
                displayName: user.displayName,
                email: user.email,
                role: "author"
            });
        } else {
            // Eğer kullanıcı zaten varsa, Firestore güncelleme (optional)
            await setDoc(userRef, {
                uid: user.uid, // güvenli olsun diye UID ekliyoruz
                displayName: user.displayName,
                email: user.email,
                role: docSnap.data().role
            }, { merge: true });
        }

        return user;
    } catch(err) {
        console.error("Login failed:", err.message);
        alert("Login failed: " + err.message);
    }
}


// Logout
export async function logout() {
    await signOut(auth);
}

// Kullanıcı rolünü çek
async function getUserRole(uid) {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data().role;
    } else {
        return "author"; // default login olmuş kullanıcı
    }
}

// Navbar itemleri
function getNavbarItems(role) {
    const items = ["Home", "Articles"];
    if (role === "author") items.push("Send Article");
    else if (role === "editor") items.push("Pending Articles");
    else if (role === "admin") items.push("Send Article", "Pending Articles", "Admin Panel");
    return items;
}

// Item → link eşlemesi
function getLink(item) {
    switch (item) {
        case "Home": return "index.html";
        case "Articles": return "articles.html";
        case "Send Article": return "author.html";
        case "Pending Articles": return "editor.html";
        case "Admin Panel": return "admin.html";
        default: return "#";
    }
}

// Navbar güncelle
function renderNavbar(items, role, displayName) {
    // Sol navbar
    navLeft.innerHTML = items.map(item => `<li><a href="${getLink(item)}">${item}</a></li>`).join("");

    // Sağ navbar
    if (role !== "reader") {
        navRight.innerHTML = `
            <span>${displayName}${role === "admin" ? " (Admin)" : role === "editor" ? " (Editor)" : ""}</span>
            <button id="logout-btn">Logout</button>
        `;
        // onclick ile duplicate önle
        document.getElementById("logout-btn").onclick = logout;
    } else {
        navRight.innerHTML = `<button id="login-btn">Login with Google</button>`;
        document.getElementById("login-btn").onclick = loginWithGoogle;
    }
}

export function trackAuthState() {
    onAuthStateChanged(auth, async (user) => {
        const navLeft = document.querySelector(".nav-left");
        const navRight = document.querySelector(".nav-right");

        let role = "reader";
        let displayName = "";
        let uid = "";

        if (user) {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                role = docSnap.data().role;   // Firestore’dan rol al
                displayName = user.displayName;
                uid = user.uid;
            }
        }

        // Navbar itemleri
        let items = ["Home", "Articles"];
        if (role === "author") items.push("Send Article");
        else if (role === "editor") items.push("Pending Articles");
        else if (role === "admin") items.push("Send Article", "Pending Articles", "Admin Panel");

        // Sol navbar
        navLeft.innerHTML = items.map(item => `<li><a href="${getLink(item)}">${item}</a></li>`).join("");

        // Sağ navbar
        if (user) {
            navRight.innerHTML = `
                <span>${displayName} (${role})</span>
                <button id="logout-btn">Logout</button>
            `;
            document.getElementById("logout-btn").onclick = logout;
        } else {
            navRight.innerHTML = `<button id="login-btn">Login with Google</button>`;
            document.getElementById("login-btn").onclick = loginWithGoogle;
        }
    });
}
