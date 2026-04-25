// ============================================================
// FitnessApp — Authentification (locale, par navigateur)
// ============================================================
// Stockage :
//   fitnessapp_users   = { "<emailLower>": { salt, hash, createdAt } }
//   fitnessapp_session = { email, expiresAt }
//   fitnessapp_data_<emailLower> = données app de l'utilisateur
// Mot de passe haché en SHA-256(password + ":" + salt). Pas une
// sécurité serveur — ça empêche juste la lecture en clair par un
// autre utilisateur du même navigateur.

const USERS_KEY = "fitnessapp_users";
const SESSION_KEY = "fitnessapp_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

// ----- Utilitaires -----
function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "{}"); }
  catch { return {}; }
}

function setUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function randomSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(password + ":" + salt);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getSession() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (!s) return null;
    if (Date.now() > s.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch { return null; }
}

function setSession(email) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    email,
    expiresAt: Date.now() + SESSION_DURATION_MS
  }));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ----- Actions -----
async function signup(email, password) {
  email = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email invalide.");
  if (password.length < 8) throw new Error("Mot de passe : 8 caractères minimum.");
  const users = getUsers();
  if (users[email]) throw new Error("Un compte existe déjà avec cet email.");
  const salt = randomSalt();
  const hash = await hashPassword(password, salt);
  users[email] = { salt, hash, createdAt: Date.now() };
  setUsers(users);
  setSession(email);
  return email;
}

async function login(email, password) {
  email = normalizeEmail(email);
  const users = getUsers();
  const user = users[email];
  if (!user) throw new Error("Aucun compte trouvé pour cet email.");
  const hash = await hashPassword(password, user.salt);
  if (hash !== user.hash) throw new Error("Mot de passe incorrect.");
  setSession(email);
  return email;
}

function logout() {
  clearSession();
  window.__currentUser = null;
  showAuth();
}

// ----- UI -----
function showAuth() {
  document.getElementById("auth-screen").style.display = "flex";
  document.getElementById("app-root").hidden = true;
}

function showApp(email) {
  window.__currentUser = email;
  document.getElementById("auth-screen").style.display = "none";
  document.getElementById("app-root").hidden = false;
  document.getElementById("current-user-email").textContent = email;
  // Démarre l'appli avec les données du compte courant
  if (typeof window.initApp === "function") window.initApp();
}

// ----- Câblage -----
document.querySelectorAll(".auth-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".auth-form").forEach(f => f.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.authTab + "-form").classList.add("active");
    document.querySelectorAll(".auth-error").forEach(e => e.textContent = "");
  });
});

document.getElementById("login-form").addEventListener("submit", async e => {
  e.preventDefault();
  const err = document.getElementById("login-error");
  err.textContent = "";
  try {
    const email = await login(
      document.getElementById("login-email").value,
      document.getElementById("login-password").value
    );
    e.target.reset();
    showApp(email);
  } catch (ex) { err.textContent = ex.message; }
});

document.getElementById("signup-form").addEventListener("submit", async e => {
  e.preventDefault();
  const err = document.getElementById("signup-error");
  err.textContent = "";
  const pw = document.getElementById("signup-password").value;
  const pwc = document.getElementById("signup-password-confirm").value;
  if (pw !== pwc) { err.textContent = "Les mots de passe ne correspondent pas."; return; }
  try {
    const email = await signup(document.getElementById("signup-email").value, pw);
    e.target.reset();
    showApp(email);
  } catch (ex) { err.textContent = ex.message; }
});

document.getElementById("logout-btn").addEventListener("click", logout);

// ----- Boot -----
(function boot() {
  const session = getSession();
  if (session) showApp(session.email);
  else showAuth();
})();
