import { auth, db, provider } from "./firebase-config.js";
import {
    GithubAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const title = document.getElementById("auth-title");
const description = document.getElementById("auth-description");
const nameField = document.getElementById("name-field");
const displayName = document.getElementById("display-name");
const email = document.getElementById("email");
const password = document.getElementById("password");
const emailForm = document.getElementById("email-form");
const emailSubmit = document.getElementById("email-submit");
const resetButton = document.getElementById("reset-password");
const status = document.getElementById("auth-status");
const githubProvider = new GithubAuthProvider();
let mode = params.get("mode") === "signup" ? "signup" : "login";

function setStatus(message, isError = false) {
    status.textContent = message;
    status.className = `auth-status${isError ? " is-error" : ""}`;
}

function getAuthErrorMessage(error) {
    const messages = {
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/wrong-password": "Incorrect password.",
        "auth/user-not-found": "No account was found with this email.",
        "auth/invalid-email": "Enter a valid email address.",
        "auth/email-already-in-use": "An account already exists with this email.",
        "auth/weak-password": "Your password must be at least 6 characters."
    };
    return messages[error.code] || error.message;
}

async function saveUserProfile(user) {
    const userRef = doc(db, "users", user.uid);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) return;

    await setDoc(userRef, {
        uid: user.uid,
        username: "",
        displayName: user.displayName || "",
        email: user.email || "",
        role: "author",
        photoURL: user.photoURL || "",
        coverURL: "",
        bio: "",
        socialLinks: { github: "", linkedin: "", twitter: "", facebook: "", instagram: "", youtube: "" },
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp()
    });
}

async function completeAuth(user) {
    await saveUserProfile(user);
    window.location.href = "index.html";
}

function updateMode(nextMode) {
    mode = nextMode;
    const isSignup = mode === "signup";
    title.textContent = isSignup ? "Make room for your ideas." : "Welcome back.";
    description.textContent = isSignup ? "Create an account to publish your work and join the conversation." : "Sign in to read, publish, and join the conversation.";
    if (nameField && displayName) {
        nameField.hidden = !isSignup;
        displayName.required = isSignup;
        displayName.disabled = !isSignup;
    }
    password.autocomplete = isSignup ? "new-password" : "current-password";
    emailSubmit.textContent = isSignup ? "Create account with email" : "Sign in with email";
    resetButton.hidden = isSignup;
    document.querySelectorAll(".auth-tab").forEach((tab) => {
        const active = tab.dataset.mode === mode;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
    });
}

async function runProviderAuth(providerToUse) {
    setStatus("Connecting...");
    try {
        const result = await signInWithPopup(auth, providerToUse);
        await completeAuth(result.user);
    } catch (error) {
        setStatus(getAuthErrorMessage(error), true);
    }
}

document.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", () => updateMode(tab.dataset.mode));
});
document.getElementById("google-button").addEventListener("click", () => runProviderAuth(provider));
document.getElementById("github-button").addEventListener("click", () => runProviderAuth(githubProvider));

emailForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(mode === "signup" ? "Creating your account..." : "Signing you in...");
    try {
        let userCredential;
        if (mode === "signup") {
            userCredential = await createUserWithEmailAndPassword(auth, email.value.trim(), password.value);
            if (displayName && displayName.value.trim()) {
                await updateProfile(userCredential.user, { displayName: displayName.value.trim() });
            }
            await sendEmailVerification(userCredential.user);
            await signOut(auth);
            setStatus("Verification email sent. Verify your email before signing in.");
            emailForm.reset();
            return;
        } else {
            userCredential = await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
            if (!userCredential.user.emailVerified) {
                await signOut(auth);
                setStatus("Please verify your email before signing in. Check your inbox.", true);
                return;
            }
        }
        await completeAuth(userCredential.user);
    } catch (error) {
        setStatus(getAuthErrorMessage(error), true);
    }
});

resetButton.addEventListener("click", async () => {
    if (!email.value.trim()) {
        setStatus("Enter your email address first.", true);
        email.focus();
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email.value.trim());
        setStatus("Password reset email sent.");
    } catch (error) {
        setStatus(getAuthErrorMessage(error), true);
    }
});

updateMode(mode);
