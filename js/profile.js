import { auth, db, storage } from "./firebase-config.js";

import {
    doc,
    getDoc,
    updateDoc,
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";
import { updateProfile } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

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

function formatTimestamp(value, fallback = "Recently") {
    if (!value) return fallback;
    const date = typeof value.toDate === "function"
        ? value.toDate()
        : value instanceof Date
            ? value
            : new Date(value);
    return Number.isNaN(date.getTime()) ? fallback : date.toLocaleDateString();
}

async function loadPublishedArticles(profileUid) {
    const articlesContainer = document.getElementById("profile-articles");
    if (!articlesContainer) return;

    try {
        const articlesQuery = query(
            collection(db, "articles"),
            where("authorUid", "==", profileUid)
        );
        const snapshot = await getDocs(articlesQuery);
        articlesContainer.innerHTML = "";
        const publishedArticles = snapshot.docs.filter(
            (articleSnapshot) => articleSnapshot.data().status === "approved"
        );

        if (!publishedArticles.length) {
            articlesContainer.innerHTML = "<p class=\"empty-state\">No published articles yet.</p>";
            return;
        }

        publishedArticles.forEach((articleSnapshot) => {
            const article = articleSnapshot.data();
            const card = document.createElement("article");
            card.className = "article-card";
            card.tabIndex = 0;
            card.setAttribute("role", "link");
            const articleUrl = `article.html?id=${encodeURIComponent(articleSnapshot.id)}`;
            const openArticle = () => {
                window.location.href = articleUrl;
            };
            card.addEventListener("click", openArticle);
            card.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openArticle();
                }
            });

            const title = document.createElement("h3");
            const titleLink = document.createElement("a");
            titleLink.href = articleUrl;
            titleLink.textContent = article.title || "Untitled article";
            title.appendChild(titleLink);

            const meta = document.createElement("p");
            meta.className = "article-meta";
            meta.textContent = `Published ${formatTimestamp(article.createdAt)}`;

            const preview = document.createElement("p");
            preview.className = "article-preview";
            const content = article.content || "";
            preview.textContent = `${content.substring(0, 200)}${content.length > 200 ? "..." : ""}`;

            card.append(title, meta, preview);
            articlesContainer.appendChild(card);
        });
    } catch (error) {
        console.error("Published articles could not be retrieved:", error);
        articlesContainer.innerHTML = "<p class=\"empty-state\">Published articles could not be loaded.</p>";
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

async function uploadCoverFile(user, file) {
    if (!file) return "";

    const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const fileName = `${user.uid}-cover-${Date.now()}.${extension}`;
    const storageRef = ref(storage, `covers/${fileName}`);

    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
}

auth.onAuthStateChanged(async (user) => {
    const requestedUid = new URLSearchParams(window.location.search).get("id");
    const profileUid = requestedUid || user?.uid;
    const isOwnProfile = Boolean(user && profileUid === user.uid);

    if (!profileUid) return;

    const userRef = doc(db, "users", profileUid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        console.log("User profile not found.");
        return;
    }

    const userData = userSnap.data();

    const profileName = userData.displayName || user?.displayName || "Unnamed User";
    const username = userData.username || "@user";
    const email = userData.email || user?.email || "No email";
    const bio = userData.bio || "No bio added yet.";
    const location = userData.location || "No location added yet.";
    const website = userData.website || "";
    const photoURL = userData.photoURL || user?.photoURL || "";
    const coverURL = userData.coverURL || "";
    const socialLinks = userData.socialLinks || {};

    if (!isOwnProfile) {
        document.getElementById("profile-form")?.remove();
        document.querySelector(".avatar-upload-btn")?.remove();
        document.querySelector(".cover-upload-btn")?.remove();
    }

    setText("profile-display-name", profileName);
    setText("profile-username", `@${username}`.replace(/^@+/, "@"));
    setText("profile-email", email);
    setText("profile-bio", bio);
    setText("profile-location", location);
    setText("profile-created", "Created: " + formatTimestamp(userData.createdAt));
    setText("profile-last-active", "Last active: " + formatTimestamp(userData.lastActive));

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
    loadPublishedArticles(profileUid);

    const profileForm = isOwnProfile ? document.getElementById("profile-form") : null;
    if (profileForm && user) {
        const avatarInput = document.getElementById("input-avatar-file");
        const coverInput = document.getElementById("input-cover-file");
        let pendingAvatarFile = null;
        let pendingCoverFile = null;
        const currentPhotoURL = photoURL;
        const currentCoverURL = coverURL;

        function openImagePreviewWindow(file, imageType) {
            const previewURL = URL.createObjectURL(file);
            const previewWindow = window.open("", "netra-image-preview", "width=620,height=560,resizable=yes");

            if (!previewWindow) {
                showSaveStatus("Please allow pop-ups to preview the image.", true);
                URL.revokeObjectURL(previewURL);
                return;
            }

            previewWindow.document.write(`
                <!doctype html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Preview ${imageType}</title>
                    <style>
                        * { box-sizing: border-box; }
                        body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; background: #0b1437; color: #d6e1ff; font: 16px Arial, sans-serif; }
                        main { width: min(100%, 560px); text-align: center; }
                        h1 { margin: 0 0 18px; font-size: 1.25rem; }
                        .preview { width: 100%; max-height: 390px; object-fit: contain; border: 1px solid rgba(255,255,255,.15); border-radius: 12px; background: rgba(255,255,255,.06); }
                        .actions { display: flex; justify-content: center; gap: 10px; margin-top: 20px; }
                        button { border: 0; border-radius: 6px; padding: 11px 20px; color: #fff; font-weight: 600; cursor: pointer; }
                        .apply { background: #287a55; }
                        .cancel { background: #743b4b; }
                        button:hover { filter: brightness(1.15); }
                    </style>
                </head>
                <body>
                    <main>
                        <h1>Is this how you want your ${imageType === "avatar" ? "avatar" : "cover image"} to look?</h1>
                        <img class="preview" src="${previewURL}" alt="${imageType} preview">
                        <div class="actions">
                            <button class="apply" type="button" data-action="apply">Yes, use this</button>
                            <button class="cancel" type="button" data-action="cancel">No, choose another</button>
                        </div>
                    </main>
                    <script>
                        document.querySelectorAll("button").forEach((button) => {
                            button.addEventListener("click", () => {
                                window.opener.postMessage({ source: "netra-image-preview", action: button.dataset.action, imageType: "${imageType}" }, window.location.origin);
                                window.close();
                            });
                        });
                    <\/script>
                </body>
                </html>
            `);
            previewWindow.document.close();
            previewWindow.focus();
        }

        function resetImageSelection(input, actions, imageId, originalURL, pendingType) {
            input.value = "";
            if (actions) actions.hidden = true;
            setImage(imageId, originalURL, "assets/logo.png");
            if (pendingType === "avatar") pendingAvatarFile = null;
            if (pendingType === "cover") pendingCoverFile = null;
        }

        if (avatarInput) {
            avatarInput.addEventListener("change", (event) => {
                const file = event.target.files?.[0];
                if (!file) return;

                pendingAvatarFile = file;
                openImagePreviewWindow(file, "avatar");
                setImage("profile-avatar", URL.createObjectURL(file), "assets/logo.png");
                showSaveStatus("Preview opened in a new window. Confirm there to save it.");
            });
        }

        if (coverInput) {
            coverInput.addEventListener("change", (event) => {
                const file = event.target.files?.[0];
                if (!file) return;

                pendingCoverFile = file;
                openImagePreviewWindow(file, "cover");
                setImage("cover-image", URL.createObjectURL(file), "assets/logo.png");
                showSaveStatus("Preview opened in a new window. Confirm there to save it.");
            });
        }

        async function applyAvatar() {
            if (!pendingAvatarFile) return;
            try {
                showSaveStatus("Uploading avatar...");
                const uploadedPhotoURL = await uploadAvatarFile(user, pendingAvatarFile);
                await updateProfile(user, { photoURL: uploadedPhotoURL });
                await updateDoc(userRef, { photoURL: uploadedPhotoURL });
                document.getElementById("input-photo-url").value = uploadedPhotoURL;
                resetImageSelection(avatarInput, null, "profile-avatar", uploadedPhotoURL, "avatar");
                showSaveStatus("Avatar updated successfully.");
            } catch (error) {
                console.error("Avatar upload failed:", error);
                showSaveStatus("Avatar upload failed. Please try again.", true);
            }
        }

        function cancelAvatar() {
            resetImageSelection(avatarInput, null, "profile-avatar", currentPhotoURL, "avatar");
        }

        async function applyCover() {
            if (!pendingCoverFile) return;
            try {
                showSaveStatus("Uploading cover image...");
                const uploadedCoverURL = await uploadCoverFile(user, pendingCoverFile);
                await updateDoc(userRef, { coverURL: uploadedCoverURL });
                document.getElementById("input-cover-url").value = uploadedCoverURL;
                resetImageSelection(coverInput, null, "cover-image", uploadedCoverURL, "cover");
                showSaveStatus("Cover image updated successfully.");
            } catch (error) {
                console.error("Cover upload failed:", error);
                showSaveStatus("Cover upload failed. Please try again.", true);
            }
        }

        function cancelCover() {
            resetImageSelection(coverInput, null, "cover-image", currentCoverURL, "cover");
        }

        window.addEventListener("message", (event) => {
            if (event.origin !== window.location.origin || event.data?.source !== "netra-image-preview") return;
            if (event.data.imageType === "avatar") {
                event.data.action === "apply" ? applyAvatar() : cancelAvatar();
            } else if (event.data.imageType === "cover") {
                event.data.action === "apply" ? applyCover() : cancelCover();
            }
        });

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