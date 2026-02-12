const firebaseConfig = {
  apiKey: "AIzaSyBMhtGTjtGItAjKMxKW1FHuTE4iND3qLYc",
  authDomain: "twitter-1fcd8.firebaseapp.com",
  projectId: "twitter-1fcd8",
  storageBucket: "twitter-1fcd8.firebasestorage.app",
  messagingSenderId: "410848303610",
  appId: "1:410848303610:web:8d1666708b7c1cd48aac43",
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// éléments html de la page principale
const email = document.getElementById("email");
const password = document.getElementById("password");
const pseudoInput = document.getElementById("pseudo");
const signup = document.getElementById("signup");
const login = document.getElementById("login");
const logout = document.getElementById("logout");
const messageInput = document.getElementById("message");
const send = document.getElementById("send");
const post = document.getElementById("post");
const messagesList = document.getElementById("messages");
const authForm = document.getElementById("authForm");
const userInfo = document.getElementById("userInfo");
const replyInfo = document.getElementById("replyInfo");
const replyTargetSpan = document.getElementById("replyTarget");
const cancelReplyBtn = document.getElementById("cancelReply");

let currentReplyTo = null; // id du message auquel on répond si on répond à un message

// Palette de couleurs prédéfinies pour les pseudos (12 couleurs)
const PSEUDO_COLORS = [
  "#d32f2f",
  "#7b1fa2",
  "#303f9f",
  "#00796b",
  "#388e3c",
  "#f57c00",
  "#5d4037",
  "#455a64",
  "#c2185b",
  "#512da8",
  "#1976d2",
  "#0097a7",
];

// Retourne une couleur prédictible à partir du string du pseudo
// fonction purement décorative
function getColorForPseudo(pseudo) {
  if (!pseudo) return "#000000";
  let hash = 0;
  for (let i = 0; i < pseudo.length; i++) {
    hash = (hash * 31 + pseudo.charCodeAt(i)) >>> 0;
  }
  const index = hash % PSEUDO_COLORS.length;
  return PSEUDO_COLORS[index];
}

function clearReplyTarget() {
  currentReplyTo = null;
  replyInfo.style.display = "none";
  replyTargetSpan.textContent = "";
}

// création de compte
signup.addEventListener("click", async () => {
  const emailVal = email.value.trim();
  const passwordVal = password.value.trim();
  const pseudoVal = pseudoInput.value.trim();

  if (!emailVal || !passwordVal) {
    alert("L'email et le mot de passe sont obligatoires.");
    return;
  }

  try {
    const cred = await auth.createUserWithEmailAndPassword(
      emailVal,
      passwordVal
    );
    await cred.user.updateProfile({ displayName: pseudoVal });

    // Stocke aussi dans la collection users
    await db
      .collection("users")
      .doc(cred.user.uid)
      .set({
        pseudo: pseudoVal,
        email: cred.user.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
  } catch (e) {
    let msg = "Erreur lors de la création du compte.";
    switch (e.code) {
      case "auth/email-already-in-use":
        msg = "Cet email est déjà utilisé. Essayez de vous connecter.";
        break;
      case "auth/invalid-email":
        msg = "L'email fourni n'est pas valide.";
        break;
      case "auth/weak-password":
        msg = "Le mot de passe est trop faible (6 caractères minimum).";
        break;
      default:
        if (e.message) {
          msg = e.message;
        }
    }
    alert(msg);
  }
});

// connexion
login.addEventListener("click", async () => {
  const emailVal = email.value.trim();
  const passwordVal = password.value.trim();

  if (!emailVal || !passwordVal) {
    alert("Email et mot de passe sont obligatoires.");
    return;
  }

  try {
    await auth.signInWithEmailAndPassword(emailVal, passwordVal);
  } catch (e) {
    let msg = "Impossible de se connecter. Vérifiez vos identifiants.";
    switch (e.code) {
      case "auth/invalid-email":
        msg = "L'email fourni n'est pas valide.";
        break;
      case "auth/user-disabled":
        msg = "Ce compte a été désactivé. Contactez un administrateur.";
        break;
      case "auth/user-not-found":
        msg = "Aucun compte trouvé pour cet email.";
        break;
      case "auth/wrong-password":
      case "auth/invalid-credential":
        msg = "Mot de passe incorrect.";
        break;
      case "auth/too-many-requests":
        msg = "Trop de tentatives échouées. Réessayez plus tard.";
        break;
      default:
        if (e.message) {
          msg = e.message;
        }
    }
    alert(msg);
  }
});

// Déconnexion
logout.addEventListener("click", async () => {
  try {
    await auth.signOut();
  } catch (e) {
    console.error(e);
    alert(e.message || "Erreur lors de la déconnexion.");
  }
});

// Gestion de l'état d'authentification
// Affiche/masque les champs login/signup
// gère les infos user de quand on envoie un message
auth.onAuthStateChanged((user) => {
  clearReplyTarget();

  if (user) {
    const pseudo = user.displayName || user.email || "Anonyme";
    userInfo.textContent = `Connecté en tant que : ${pseudo}`;
    authForm.style.display = "none";
    logout.style.display = "block";
    post.style.display = "block";
  } else {
    userInfo.textContent = "Non connecté.";
    authForm.style.display = "block";
    logout.style.display = "none";
    post.style.display = "none";
  }
});

cancelReplyBtn.addEventListener("click", () => {
  clearReplyTarget();
});

function setReplyTarget(messageNode) {
  currentReplyTo = messageNode.id;
  replyTargetSpan.textContent =
    messageNode.displayName || messageNode.email || "Anonyme";
  replyInfo.style.display = "block";
}

// Envoyer un message (dans le channel principal ou en réponse à un message)
// le message est déjà écrit et on sait où on l'envoie
send.addEventListener("click", async () => {
  const text = messageInput.value.trim();
  const user = auth.currentUser;

  if (!text) return;
  if (!user) {
    alert("Tu dois être connecté pour envoyer un message.");
    return;
  }

  try {
    await db.collection("messages").add({
      text,
      authorId: user.uid,
      displayName: user.displayName || user.email || "Anonyme",
      email: user.email,
      parentId: currentReplyTo || null,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
    messageInput.value = "";
    clearReplyTarget();
  } catch (e) {
    console.error(e);
    alert(e.message || "Erreur lors de l'envoi du message.");
  }
});

// Construction de l'arbre des messages (toutes les réponses)
function buildMessageTree(snapshot) {
  const nodes = new Map();

  snapshot.forEach((doc) => {
    const data = doc.data();
    nodes.set(doc.id, {
      id: doc.id,
      text: data.text || "",
      displayName: data.displayName || data.email || "Anonyme",
      email: data.email || "",
      timestamp: data.timestamp ? data.timestamp.toDate() : new Date(0),
      parentId: data.parentId || null,
      children: [],
    });
  });

  const roots = [];

  nodes.forEach((node) => {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Tri des messages, les plus récents en haut
  roots.sort((a, b) => b.timestamp - a.timestamp);

  // Tri des réponses, plus anciennes en haut
  function sortChildren(n) {
    n.children.sort((a, b) => a.timestamp - b.timestamp);
    n.children.forEach(sortChildren);
  }
  roots.forEach(sortChildren);

  return roots;
}

// Rendu d'un message
// gère aussi le cas où le message a des enfants
function renderMessage(node, container, depth = 0, hiddenInitially = false) {
  const li = document.createElement("li");
  li.style.marginLeft = depth * 16 + "px";
  li.style.display = hiddenInitially ? "none" : "block";

  const header = document.createElement("div");
  header.className = "msg-header";

  const nameEl = document.createElement("span");
  nameEl.textContent = node.displayName;
  nameEl.style.fontWeight = "bold";
  nameEl.style.color = getColorForPseudo(node.displayName);
  header.appendChild(nameEl);

  const meta = document.createElement("span");
  meta.className = "msg-meta";
  if (node.timestamp) {
    meta.textContent = ` (${node.timestamp.toLocaleString()})`;
  }
  header.appendChild(meta);

  const textEl = document.createElement("div");
  textEl.className = "msg-text";
  textEl.textContent = node.text;

  const actions = document.createElement("div");
  actions.className = "msg-actions";
  const replyBtn = document.createElement("button");
  replyBtn.type = "button";
  replyBtn.textContent = "Répondre";
  replyBtn.addEventListener("click", () => setReplyTarget(node));
  actions.appendChild(replyBtn);

  li.appendChild(header);
  li.appendChild(textEl);
  li.appendChild(actions);

  container.appendChild(li);

  if (node.children.length > 0) {
    const childrenContainer = document.createElement("ul");
    childrenContainer.style.listStyle = "none";
    childrenContainer.style.paddingLeft = "0";

    node.children.forEach((child, index) => {
      const hide = index >= 2; // on affiche les 2 premières réponses,
      renderMessage(child, childrenContainer, depth + 1, hide);
    });

    container.appendChild(childrenContainer);

    if (node.children.length > 2) {
      const toggleLi = document.createElement("li");
      toggleLi.style.marginLeft = (depth + 1) * 16 + "px";

      const toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.textContent = `Afficher ${
        node.children.length - 2
      } réponses supplémentaires`;

      let expanded = false;
      toggleBtn.addEventListener("click", () => {
        expanded = !expanded;
        node.children.forEach((_, idx) => {
          if (idx >= 2) {
            const childEl = childrenContainer.children[idx];
            if (childEl) {
              childEl.style.display = expanded ? "block" : "none";
            }
          }
        });
        toggleBtn.textContent = expanded
          ? "Réduire les réponses"
          : `Afficher ${node.children.length - 2} réponses supplémentaires`;
      });

      toggleLi.appendChild(toggleBtn);
      container.appendChild(toggleLi);
    }
  }
}

// Affichage temps réel
db.collection("messages")
  .orderBy("timestamp")
  .onSnapshot((snapshot) => {
    messagesList.innerHTML = "";
    const roots = buildMessageTree(snapshot);
    roots.forEach((root) => {
      renderMessage(root, messagesList, 0, false);
    });
  });