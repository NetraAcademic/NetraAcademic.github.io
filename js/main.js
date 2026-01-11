import { trackAuthState, loginWithGoogle } from "./auth.js";

// Kullanıcı durumunu başlat
trackAuthState();

// (İsteğe bağlı) Login butonuna tıklayınca test
const loginBtn = document.getElementById("login-btn");
if(loginBtn){
    loginBtn.addEventListener("click", loginWithGoogle);
}
    