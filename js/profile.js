import { auth, db, storage } from "./firebase-config.js";

import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";

function setText(id, value, fallback = "") {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value || fallback;
}

function setImage(id, value, fallback = "") {
    const el = document.getElementById(id);
    if (!el) return;
    el.src = value || fallback;
    if (!value) {
        el.style.display = "none";
    } else {
        el.style.display = "block";
    }
}

function renderSocialLinks(links = {}) {
    const socialContainer = document.getElementById("social-links");
    if (!socialContainer) return;

    socialContainer.innerHTML = "";
    const items = [
        { key: "github", label: "GitHub" },
        { key: "linkedin", label: "LinkedIn" },
        { key: "twitter", label: "Twitter" },
        { key: "facebook", label: "Facebook" },
        { key: "instagram", label: "Instagram" },
        { key: "youtube", label: "YouTube" },
    ];

    const validLinks = items.filter(({ key }) => links?.[key]);

    if (!validLinks.length) {
        const emptyState = document.createElement("span");
        emptyState.className = "empty-state";
        emptyState.textContent = "No social links yet";
        socialContainer.appendChild(emptyState);
        return;
    }

    validLinks.forEach(({ key, label }) => {
        const url = links[key];
        const link = document.createElement("a");
        link.href = url.startsWith("http") ? url : `https://${url}`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = label;
        socialContainer.appendChild(link);
    });
}

function populateFormFields(userData) {
    const formMap = {
        "input-username": userData.username || "",
        "input-display-name": userData.displayName || "",
        "input-email": userData.email || "",
        "input-photo-url": userData.photoURL || "",
        "input-cover-url": userData.coverURL || "",
        "input-bio": userData.bio || "",
        "input-location": userData.location || "",
        "input-website": userData.website || "",
        "input-social-github": userData.socialLinks?.github || "",
        "input-social-linkedin": userData.socialLinks?.linkedin || "",
        "input-social-twitter": userData.socialLinks?.twitter || "",
        "input-social-facebook": userData.socialLinks?.facebook || "",
        "input-social-instagram": userData.socialLinks?.instagram || "",
        "input-social-youtube": userData.socialLinks?.youtube || "",
    };

    Object.entries(formMap).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) {
            el.value = value;
        }
    });
}

function showSaveStatus(message, isError = false) {
    const statusEl = document.getElementById("profile-save-status");
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.style.color = isError ? "#b42318" : "#166534";
}

async function uploadAvatarFile(user, file) {
    if (!file) return "";

    const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const fileName = `${user.uid}-avatar-${Date.now()}.${extension}`;
    const storageRef = ref(storage, `avatars/${fileName}`);

    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
}

auth.onAuthStateChanged(async (user) => {
    if (!user) {
        return;
    }

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        console.log("User profile not found.");
        return;
    }

    const userData = userSnap.data();

    const profileName = userData.displayName || user.displayName || "Unnamed User";
    const username = userData.username || "@user";
    const email = userData.email || user.email || "No email";
    const bio = userData.bio || "No bio added yet.";
    const location = userData.location || "No location added yet.";
    const website = userData.website || "";
    const photoURL = userData.photoURL || user.photoURL || "";
    const coverURL = userData.coverURL || "";
    const socialLinks = userData.socialLinks || {};

    setText("profile-display-name", profileName);
    setText("profile-username", `@${username}`.replace(/^@+/, "@"));
    setText("profile-email", email);
    setText("profile-bio", bio);
    setText("profile-location", location);
    setText("profile-created", "Created: " + (userData.createdAt?.toDate ? userData.createdAt.toDate().toLocaleDateString() : "Recently"));
    setText("profile-last-active", "Last active: " + (userData.lastActive?.toDate ? userData.lastActive.toDate().toLocaleDateString() : "Recently"));

    const websiteEl = document.getElementById("profile-website");
    if (websiteEl) {
        if (website) {
            websiteEl.href = website.startsWith("http") ? website : `https://${website}`;
            websiteEl.textContent = website.replace(/^https?:\/\//, "");
            websiteEl.style.display = "inline";
        } else {
            websiteEl.textContent = "No website added";
            websiteEl.removeAttribute("href");
            websiteEl.style.display = "inline";
        }
    }

    setImage("profile-avatar", photoURL, "assets/logo.png");
    setImage("cover-image", coverURL, "assets/logo.png");
    renderSocialLinks(socialLinks);
    populateFormFields(userData);

    const profileForm = document.getElementById("profile-form");
    if (profileForm) {
        const avatarInput = document.getElementById("input-avatar-file");

        if (avatarInput) {
            avatarInput.addEventListener("change", async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;

                try {
                    showSaveStatus("Uploading avatar...");
                    const photoURL = await uploadAvatarFile(user, file);
                    document.getElementById("input-photo-url").value = photoURL;
                    setImage("profile-avatar", photoURL, "assets/logo.png");
                    showSaveStatus("Avatar uploaded successfully.");
                } catch (error) {
                    console.error("Avatar upload failed:", error);
                    showSaveStatus("Avatar upload failed. Please try again.", true);
                }
            });
        }

        profileForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const updatedData = {
                username: document.getElementById("input-username").value.trim(),
                displayName: document.getElementById("input-display-name").value.trim(),
                email: document.getElementById("input-email").value.trim(),
                photoURL: document.getElementById("input-photo-url").value.trim(),
                coverURL: document.getElementById("input-cover-url").value.trim(),
                bio: document.getElementById("input-bio").value.trim(),
                location: document.getElementById("input-location").value.trim(),
                website: document.getElementById("input-website").value.trim(),
                socialLinks: {
                    github: document.getElementById("input-social-github").value.trim(),
                    linkedin: document.getElementById("input-social-linkedin").value.trim(),
                    twitter: document.getElementById("input-social-twitter").value.trim(),
                    facebook: document.getElementById("input-social-facebook").value.trim(),
                    instagram: document.getElementById("input-social-instagram").value.trim(),
                    youtube: document.getElementById("input-social-youtube").value.trim(),
                }
            };

            try {
                await updateDoc(userRef, updatedData);
                showSaveStatus("Profile updated successfully.");
                setText("profile-display-name", updatedData.displayName || user.displayName || "Unnamed User");
                setText("profile-username", `@${updatedData.username || userData.username || "user"}`.replace(/^@+/, "@"));
                setText("profile-email", updatedData.email || user.email || "No email");
                setText("profile-bio", updatedData.bio || "No bio added yet.");
                setText("profile-location", updatedData.location || "No location added yet.");
                setImage("profile-avatar", updatedData.photoURL || user.photoURL || "", "assets/logo.png");
                setImage("cover-image", updatedData.coverURL || "", "assets/logo.png");
                renderSocialLinks(updatedData.socialLinks);
            } catch (error) {
                console.error("Profile save failed:", error);
                showSaveStatus("Could not save profile. Please try again.", true);
            }
        });
    }
});