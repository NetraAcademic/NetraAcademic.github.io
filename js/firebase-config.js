import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js"; 

const firebaseConfig = {
    apiKey: "AIzaSyBQH4CYlufdOhD9gkjeU1CIY86TO06SpHY",
    authDomain: "netraacademic-f8c5e.firebaseapp.com",
    projectId: "netraacademic-f8c5e",
    storageBucket: "netraacademic-f8c5e.firebasestorage.app",
    messagingSenderId: "636315252452",
    appId: "1:636315252452:web:23ea5c751e5c38afafdef1"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app); 


export { app, auth, provider, db };
