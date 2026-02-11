// Configuration Firebase de ton projet (console Firebase > Project settings > Web app)
const firebaseConfig = {
  apiKey: "AIzaSyBMhtGTjtGItAjKMxKW1FHuTE4iND3qLYc",
  authDomain: "twitter-1fcd8.firebaseapp.com",
  projectId: "twitter-1fcd8",
  storageBucket: "twitter-1fcd8.firebasestorage.app",
  messagingSenderId: "410848303610",
  appId: "1:410848303610:web:8d1666708b7c1cd48aac43",
};

// Initialisation Firebase (SDK compat chargé via les <script> dans index.html)
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// --- DOM Elements ---
const email = document.getElementById("email");
const password = document.getElementById("password");
const signup = document.getElementById("signup");
const login = document.getElementById("login");
const logout = document.getElementById("logout");
const message = document.getElementById("message");
const send = document.getElementById("send");
const post = document.getElementById("post");
const messages = document.getElementById("messages");

// --- Auth Events (création de compte) ---
signup.addEventListener("click", () => {
  if (!email.value || !password.value) {
    alert("Email et mot de passe obligatoires.");
    return;
  }

  auth
    .createUserWithEmailAndPassword(email.value, password.value)
    .catch((e) => alert(e.message));
});

// --- Auth Events (connexion) ---
login.addEventListener("click", () => {
  if (!email.value || !password.value) {
    alert("Email et mot de passe obligatoires.");
    return;
  }

  auth
    .signInWithEmailAndPassword(email.value, password.value)
    .catch((e) => alert(e.message));
});

// --- Déconnexion ---
logout.addEventListener("click", () => auth.signOut());

// --- Auth State ---
auth.onAuthStateChanged((user) => {
  if (user) {
    post.style.display = "block";
    logout.style.display = "inline";
  } else {
    post.style.display = "none";
    logout.style.display = "none";
  }
});

// --- Envoyer un message ---
send.addEventListener("click", () => {
  if (message.value.trim() === "") return;
  if (!auth.currentUser) {
    alert("Tu dois être connecté pour envoyer un message.");
    return;
  }

  db.collection("messages").add({
    text: message.value,
    email: auth.currentUser.email,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  });
  message.value = "";
});

// --- Affichage temps réel ---
db.collection("messages")
  .orderBy("timestamp")
  .onSnapshot((snapshot) => {
    messages.innerHTML = "";
    snapshot.forEach((doc) => {
      const li = document.createElement("li");
      li.textContent = `${doc.data().email}: ${doc.data().text}`;
      messages.appendChild(li);
    });
  });