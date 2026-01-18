import { auth, provider, db } from "./firebase-config.js";
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";


const navLeft = document.querySelector(".nav-left");
const navRight = document.querySelector(".nav-right");


export async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        if(!docSnap.exists()){
            await setDoc(userRef, {
                uid: user.uid,                
                displayName: user.displayName,
                email: user.email,
                role: "author"
            });
        } else {
            await setDoc(userRef, {
                uid: user.uid, 
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



export async function logout() {
    await signOut(auth);
}


async function getUserRole(uid) {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data().role;
    } else {
        return "author";
    }
}


function getNavbarItems(role) {
    const items = [ "Articles"];
    if (role === "author") items.push("Send Article");
    else if (role === "editor") items.push("Pending Articles");
    else if (role === "admin") items.push("Send Article", "Pending Articles", "Admin Panel");
    return items;
}


function getLink(item) {
    switch (item) {
        //case "Home": return "index.html";
        case "Articles": return "articles.html";
        case "Send Article": return "author.html";
        case "Pending Articles": return "editor.html";
        case "Admin Panel": return "admin.html";
        default: return "#";
    }
}


function renderNavbar(items, role, displayName) {
    navLeft.innerHTML = items.map(item => `<li><a href="${getLink(item)}">${item}</a></li>`).join("");

    if (role !== "reader") {
        navRight.innerHTML = `
            <span>${displayName}${role === "admin" ? " (Admin)" : role === "editor" ? " (Editor)" : ""}</span>
            <button id="logout-btn">Logout</button>
        `;
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
                role = docSnap.data().role;  
                displayName = user.displayName;
                uid = user.uid;
            }
        }

       
        let items = [ "Articles"];
        if (role === "author") items.push("Send Article");
        else if (role === "editor") items.push("Send Article", "Pending Articles");
        else if (role === "admin") items.push("Send Article", "Pending Articles", "Admin Panel");

    
        navLeft.innerHTML = items.map(item => `<li><a href="${getLink(item)}">${item}</a></li>`).join("");

    
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
