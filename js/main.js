import { trackAuthState, loginWithGoogle } from "./auth.js";


trackAuthState();


const loginBtn = document.getElementById("login-btn");
if(loginBtn){
    loginBtn.addEventListener("click", loginWithGoogle);
}
    