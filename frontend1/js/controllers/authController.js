import { getAuthConfig, registerAccount, loginAccount } from "../services/authService.js";

export function setAuthMode(mode, state) {
  state.authMode = mode === "register" ? "register" : "login";

  const loginTab = document.getElementById("tabLogin");
  const registerTab = document.getElementById("tabRegister");
  const emailField = document.getElementById("emailField");
  const authSubmitButton = document.getElementById("authSubmitButton");
  const authHint = document.getElementById("authHint");

  loginTab?.classList.toggle("active", state.authMode === "login");
  registerTab?.classList.toggle("active", state.authMode === "register");
  emailField?.classList.toggle("hidden", state.authMode === "login");

  if (authSubmitButton) {
    authSubmitButton.textContent = state.authMode === "login" ? "Se connecter" : "Creer mon compte";
  }

  if (authHint) {
    authHint.textContent =
      state.authMode === "login"
        ? "Connexion via backend1 (Keycloak)."
        : "Inscription via backend1 puis connexion automatique.";
  }
}

export async function bindAuthView({
  state,
  setLoading,
  showToast,
  onAuthenticated
}) {
  const loginTab = document.getElementById("tabLogin");
  const registerTab = document.getElementById("tabRegister");
  const authForm = document.getElementById("authForm");
  const authSubmitButton = document.getElementById("authSubmitButton");
  const authStatus = document.getElementById("authStatus");
  const issuerInfo = document.getElementById("issuerInfo");

  loginTab?.addEventListener("click", () => setAuthMode("login", state));
  registerTab?.addEventListener("click", () => setAuthMode("register", state));

  try {
    const config = await getAuthConfig();
    if (issuerInfo) {
      issuerInfo.textContent = `Realm: ${config.realm} | Client: ${config.clientId}`;
    }
  } catch {
    if (issuerInfo) {
      issuerInfo.textContent = "Configuration auth indisponible";
    }
  }

  authForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("authUsername")?.value.trim() || "";
    const email = document.getElementById("authEmail")?.value.trim() || "";
    const password = document.getElementById("authPassword")?.value || "";

    if (!username || !password || (state.authMode === "register" && !email)) {
      showToast("Veuillez remplir tous les champs requis.", "error");
      return;
    }

    setLoading(
      authSubmitButton,
      true,
      state.authMode === "login" ? "Connexion..." : "Creation..."
    );

    if (authStatus) {
      authStatus.textContent = "";
    }

    try {
      if (state.authMode === "register") {
        await registerAccount({ username, email, password });
      }

      const tokens = await loginAccount({ username, password });

      onAuthenticated({
        username,
        email,
        tokens
      });
    } catch (error) {
      if (authStatus) {
        authStatus.textContent = error.message;
      }
      showToast(error.message, "error");
    } finally {
      setLoading(
        authSubmitButton,
        false,
        state.authMode === "login" ? "Se connecter" : "Creer mon compte"
      );
    }
  });
}
