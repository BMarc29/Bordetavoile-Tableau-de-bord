/* ==== src/components/GestionUI.jsx – Version Supabase ==== */

const { useState, useEffect, useMemo } = React;

/* ---------- stockage local minimal pour l’utilisateur courant (pour le header) ---------- */
const userStore = {
  getCurrent() {
    try {
      return JSON.parse(localStorage.getItem("btv_current_user") || "null");
    } catch {
      return null;
    }
  },
  setCurrent(user) {
    try {
      localStorage.setItem("btv_current_user", JSON.stringify(user || null));
    } catch {}
  },
};

/* ---------- LoginScreen : 100 % Supabase (email + mot de passe) ---------- */
function LoginScreen({ users, onLogin, onCreateFirstUser, onRegisterRequest }) {
  const hasUsers = users && users.length > 0;
  const [mode, setMode] = useState(hasUsers ? "login" : "first"); // "first" | "login" | "request"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

    // 🔑 Mot de passe oublié
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      alert("Entre ton e-mail pour recevoir un lien de réinitialisation.");
      return;
    }

    try {
      const { error } = await window.supabaseClient.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: "https://bordetavoile-tableau-de-bord.vercel.app/reset",
        }
      );

      if (error) {
        alert("Erreur : " + error.message);
      } else {
        alert("Un lien de réinitialisation vient d’être envoyé sur ton e-mail.");
      }
    } catch (e) {
      alert("Erreur inattendue : " + (e.message || e));
    }
  };

  const reset = () => {
    setName("");
    setEmail("");
    setPassword("");
  };

  const handleFirstSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("Nom, e-mail et mot de passe sont obligatoires.");
      return;
    }
    onCreateFirstUser &&
      onCreateFirstUser({
        name: name.trim(),
        email: email.trim(),
        password,
      });
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      alert("E-mail et mot de passe sont obligatoires.");
      return;
    }
    onLogin &&
      onLogin({
        email: email.trim(),
        password,
      });
  };

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("Nom, e-mail et mot de passe sont obligatoires pour la demande.");
      return;
    }
    onRegisterRequest &&
      onRegisterRequest({
        name: name.trim(),
        email: email.trim(),
        password,
      });
    setMessage(
      "Demande enregistrée. Un administrateur devra valider ce compte."
    );
    setMode("login");
    reset();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg,#022b3a,#011520)",
        color: "white",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 460,
          width: "100%",
          background: "rgba(0,0,0,0.35)",
          borderRadius: 18,
          padding: 24,
          boxShadow: "0 10px 24px rgba(0,0,0,0.4)",
        }}
      >
        <h1 style={{ margin: 0, marginBottom: 8, fontSize: 26 }}>
          BORDE TA VOILE
        </h1>
        <p style={{ margin: 0, marginBottom: 18, opacity: 0.9 }}>
          Tableau de bord prospection — accès sécurisé
        </p>

        {/* Onglets */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {!hasUsers && (
            <button
              type="button"
              className={mode === "first" ? "btn cta" : "btn secondary"}
              onClick={() => {
                setMode("first");
                reset();
              }}
            >
              👤 Créer mon premier compte
            </button>
          )}
          {hasUsers && (
            <>
              <button
                type="button"
                className={mode === "login" ? "btn cta" : "btn secondary"}
                onClick={() => {
                  setMode("login");
                  reset();
                }}
              >
                🔐 Se connecter
              </button>
                <button
                  type="button"
                  className={mode === "request" ? "btn cta" : "btn secondary"}
                  onClick={() => {
                    setMode("request");
                    reset();
                  }}
                >

                ✉️ Demander un accès
              </button>
            </>
          )}
        </div>

        {message && (
          <div style={{ fontSize: 13, marginBottom: 12, opacity: 0.9 }}>
            {message}
          </div>
        )}

        {/* Création du 1er admin */}
        {mode === "first" && !hasUsers && (
          <form onSubmit={handleFirstSubmit}>
            <p style={{ fontSize: 14, marginTop: 0 }}>
              Aucun compte n’existe encore. Crée d’abord ton compte
              administrateur.
            </p>
            <div className="form-row">
              <label>Nom complet</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex. Marc Bampton"
              />
            </div>
            <div className="form-row">
              <label>E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@bordetavoile.fr"
              />
            </div>
            <div className="form-row">
              <label>Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
              />
            </div>
            <button type="submit" className="btn cta" style={{ marginTop: 16 }}>
              Créer mon compte admin
            </button>
          </form>
        )}

        {/* Connexion */}
        {mode === "login" && hasUsers && (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-row">
              <label>E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton.email@exemple.fr"
              />
            </div>
            <div className="form-row">
              <label>Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
              />
            </div>
            <button type="submit" className="btn cta" style={{ marginTop: 16 }}>
              Se connecter
            </button>
          </form>
        )}
        <button
          type="button"
          className="btn secondary"
          style={{ marginTop: 12 }}
          onClick={handleForgotPassword}
        >
          🔑 Mot de passe oublié ?
        </button>

        {/* Demande d’accès */}
        {mode === "request" && (
          <form onSubmit={handleRequestSubmit}>
            <p style={{ fontSize: 14, marginTop: 0 }}>
              Ta demande sera visible par les administrateurs, qui pourront
              l’activer ou la refuser.
            </p>
            <div className="form-row">
              <label>Nom complet</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom Prénom"
              />
            </div>
            <div className="form-row">
              <label>E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton.email@exemple.fr"
              />
            </div>
            <div className="form-row">
              <label>Mot de passe souhaité</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn cta" style={{ marginTop: 16 }}>
              Envoyer la demande
            </button>
          </form>
        )}

        {!hasUsers && mode !== "first" && (
          <p style={{ fontSize: 12, marginTop: 14, opacity: 0.8 }}>
            Aucun utilisateur n’est encore configuré. Utilise d’abord{" "}
            <b>“Créer mon premier compte”</b>.
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------- Hook mobile ---------- */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 700px)").matches
      : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(max-width: 700px)");
    const handler = (e) => setIsMobile(e.matches);

    setIsMobile(mq.matches);

    if (mq.addEventListener) {
      mq.addEventListener("change", handler);
    } else if (mq.addListener) {
      mq.addListener(handler);
    }

    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener("change", handler);
      } else if (mq.removeListener) {
        mq.removeListener(handler);
      }
    };
  }, []);

  return isMobile;
}

/* ---------- Supabase : gestion des utilisateurs ---------- */
const supabase = window.supabaseClient;

const userApi = {
  async loadUsers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("loadUsers error", error);
      return [];
    }
    return data || [];
  },

  async registerUser({ name, email, password }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    const authUser = data.user;

    const { error: pError } = await supabase.from("profiles").insert({
      id: authUser.id,
      email,
      name,
      role: "user",
      status: "pending",
    });
    if (pError) throw pError;
    return authUser;
  },

  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    const authUser = data.user;

    const { data: profile, error: pError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (pError) throw pError;
    return profile;
  },

  async getCurrentProfile() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;

    const { data: profile, error: pError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (pError) return null;
    return profile;
  },

  async logout() {
    await supabase.auth.signOut();
  },

  async updateUser(user) {
    const { error } = await supabase
      .from("profiles")
      .update({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      })
      .eq("id", user.id);
    if (error) throw error;
  },

  async deleteUser(id) {
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) throw error;
  },

  async addUserAdmin({ name, email, password, role }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    const authUser = data.user;

    const { error: pError } = await supabase.from("profiles").insert({
      id: authUser.id,
      email,
      name,
      role,
      status: "active",
    });
    if (pError) throw pError;

    return authUser;
  },
};

/* ---------- constantes & helpers déjà présents dans ton projet ---------- */

const G_CAL_EMBED_BASE =
  "https://calendar.google.com/calendar/embed?src=bordetavoile%40gmail.com&ctz=Europe%2FParis";

const COEF_KM = 0.665;
const ensureHttp = (u) =>
  !u
    ? ""
    : /^https?:\/\//i.test(String(u).trim())
    ? String(u).trim()
    : "https://" + String(u).trim();
const openURL = (u) => {
  const url = ensureHttp(u);
  if (!url) return;
  if (window.btv?.openExternal) window.btv.openExternal(url);
  else window.open(url, "_blank", "noopener");
};
const norm = (s) => (s || "").toString().trim().toLowerCase();
const todayISO = () => new Date().toISOString().slice(0, 10);

/* ... ICI je garde tous tes référentiels et ton gros composant GestionUI :
   SECTEURS, ACTIONS, ACTION_DELAYS, JB_CHANNELS, JB_ACTIONS, STAT_STEPS,
   store, MobileUI, etc.

   👉 Comme ils sont longs, je ne les réécris pas en entier ici pour ne pas exploser la réponse.
   MAIS tu les as déjà dans ton fichier actuel, et ils n’ont pas besoin d’être modifiés
   pour la partie Supabase.
*/

/* --------- Modale admin utilisateurs --------- */
function UserAdminModal({
  users,
  onAddUser,
  onDeleteUser,
  onUpdateUser,
  onClose,
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("Nom, e-mail et mot de passe sont requis.");
      return;
    }
    onAddUser &&
      onAddUser({
        name: name.trim(),
        email: email.trim(),
        role,
        password,
      });
    setName("");
    setEmail("");
    setPassword("");
    setRole("user");
  };

  const labelStatus = (u) => {
    const s = u.status || "active";
    if (s === "pending") return "En attente";
    if (s === "disabled") return "Désactivé";
    return "Actif";
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal solid" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Gestion des utilisateurs</h3>
          <button className="btn small" onClick={onClose}>
            Fermer
          </button>
        </div>

        <h4>Utilisateurs existants</h4>
        <ul className="user-list">
          {users.map((u) => (
            <li key={u.id} className="user-item">
              <div>
                <strong>{u.name}</strong> — {u.email} ({u.role}){" "}
                <span style={{ fontSize: 12, opacity: 0.8 }}>
                  · {labelStatus(u)}
                </span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {(u.status || "active") === "pending" && (
                  <button
                    className="btn small"
                    onClick={() =>
                      onUpdateUser && onUpdateUser({ ...u, status: "active" })
                    }
                  >
                    Valider
                  </button>
                )}
                {(u.status || "active") === "active" && (
                  <button
                    className="btn small"
                    onClick={() =>
                      onUpdateUser &&
                      onUpdateUser({ ...u, status: "disabled" })
                    }
                  >
                    Désactiver
                  </button>
                )}
                {(u.status || "active") === "disabled" && (
                  <button
                    className="btn small"
                    onClick={() =>
                      onUpdateUser && onUpdateUser({ ...u, status: "active" })
                    }
                  >
                    Réactiver
                  </button>
                )}
                <button
                  className="btn small danger"
                  onClick={() => {
                    if (
                      confirm(
                        `Supprimer l'utilisateur « ${u.name} » ? Cette opération est définitive.`
                      )
                    ) {
                      onDeleteUser && onDeleteUser(u.id);
                    }
                  }}
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
          {!users.length && <li>Aucun utilisateur pour le moment.</li>}
        </ul>

        <hr style={{ margin: "12px 0" }} />

        <h4>Ajouter un utilisateur</h4>
        <form onSubmit={handleAdd} className="modal-grid">
          <div>
            <label>Nom</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label>E-mail</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label>Rôle</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="user">Utilisateur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          <div>
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div
            className="modal-actions centered"
            style={{ gridColumn: "1 / -1" }}
          >
            <button type="submit" className="btn cta">
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---- App racine : gère login + GestionUI ---- */
function App() {
  const [users, setUsers] = useState([]);        // viendront de Supabase
  const [currentUser, setCurrentUser] = useState(null); // profil Supabase
  const [showUserAdmin, setShowUserAdmin] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const isMobile = useIsMobile();

  // Chargement initial : liste des utilisateurs + utilisateur connecté
  useEffect(() => {
    // 1) Charger tous les profils depuis Supabase
    (async () => {
      try {
        const list = await userApi.loadUsers();
        setUsers(list || []);
      } catch (e) {
        console.error("Erreur loadUsers:", e);
        alert("Impossible de charger la liste des utilisateurs (Supabase).");
      } finally {
        setLoadingUsers(false);
      }
    })();

    // 2) Récupérer le profil de l’utilisateur actuellement connecté (s’il y en a un)
    (async () => {
      try {
        const profile = await userApi.getCurrentProfile();
        setCurrentUser(profile);
      } catch (e) {
        console.error("Erreur getCurrentProfile:", e);
      } finally {
        setAuthChecked(true);
      }
    })();
  }, []);

  // Ajouter / enlever la classe logged-out sur le <body>
  useEffect(() => {
    if (currentUser) {
      document.body.classList.remove("logged-out");
    } else {
      document.body.classList.add("logged-out");
    }
  }, [currentUser]);

  // Sauvegarde de l'utilisateur courant + mise à jour du chip dans le header
  useEffect(() => {
    userStore.setCurrent(currentUser || null);
    try {
      const chip = document.getElementById("indUser");
      if (chip) {
        chip.textContent = currentUser
          ? `👤 ${currentUser.name} (${currentUser.role})`
          : "Invité (non connecté)";
      }
    } catch {}
  }, [currentUser]);

  // --- VERSION SUPABASE ---

const handleLogin = async ({ email, password }) => {
  try {
    const profile = await userApi.login({ email, password });
    setCurrentUser(profile);
  } catch (e) {
    console.error(e);
    alert("Connexion impossible : " + (e.message || e));
  }
};
async function handleForgotPassword(email) {
  if (!email.trim()) {
    alert("Entre ton e-mail pour recevoir un lien de réinitialisation.");
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "https://bordetavoile-tableau-de-bord.vercel.app/reset",
  });

  if (error) {
    alert("Erreur : " + error.message);
  } else {
    alert("Un lien de réinitialisation vient d’être envoyé !");
  }
}

const handleLogout = async () => {
  if (!confirm("Se déconnecter ?")) return;
  try {
    await userApi.logout();
    setCurrentUser(null);
  } catch (e) {
    console.error(e);
    alert("Erreur déconnexion : " + (e.message || e));
  }
};

const handleCreateFirstUser = async ({ name, email, password }) => {
  try {
    await userApi.addUserAdmin({ name, email, password, role: "admin" });
    const list = await userApi.loadUsers();
    setUsers(list || []);
    const profile = list.find((u) => u.email === email);
    setCurrentUser(profile || null);
  } catch (e) {
    console.error(e);
    alert("Impossible de créer le premier compte : " + e.message);
  }
};

const handleRegisterRequest = async ({ name, email, password }) => {
  try {
    await userApi.registerUser({ name, email, password }); // status: pending
    const list = await userApi.loadUsers();
    setUsers(list || []);
  } catch (e) {
    console.error(e);
    alert("Erreur demande d'accès : " + e.message);
  }
};

const handleAddUser = async ({ name, email, password, role }) => {
  try {
    await userApi.addUserAdmin({ name, email, password, role });
    const list = await userApi.loadUsers();
    setUsers(list || []);
  } catch (e) {
    console.error(e);
    alert("Erreur ajout utilisateur : " + e.message);
  }
};

const handleUpdateUser = async (user) => {
  try {
    await userApi.updateUser(user);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
    setCurrentUser((cur) => (cur && cur.id === user.id ? user : cur));
  } catch (e) {
    console.error(e);
    alert("Erreur update utilisateur : " + e.message);
  }
};

const handleDeleteUser = async (id) => {
  if (!confirm("Supprimer cet utilisateur ?")) return;
  try {
    await userApi.deleteUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setCurrentUser((cur) => (cur && cur.id === id ? null : cur));
  } catch (e) {
    console.error(e);
    alert("Erreur suppression utilisateur : " + e.message);
  }
};

  // Si pas connecté -> écran de connexion plein écran
  if (!currentUser) {
    return (
      <LoginScreen
        users={users}
        onLogin={handleLogin}
        onCreateFirstUser={handleCreateFirstUser}
        onRegisterRequest={handleRegisterRequest}
      />
    );
  }

  // Sinon, on affiche la barre utilisateur + l'app de gestion
  return (
    <>
      <div className="userbar">
        <span>
          Connecté : <strong>{currentUser.name}</strong> ({currentUser.role})
        </span>
        <div className="userbar-actions">
          {currentUser.role === "admin" && (
            <button
              className="btn small"
              onClick={() => setShowUserAdmin(true)}
            >
              Utilisateurs
            </button>
          )}
          <button className="btn small" onClick={handleLogout}>
            Se déconnecter
          </button>
        </div>
      </div>

      <GestionUI currentUser={currentUser} isMobile={isMobile} />

      {showUserAdmin && (
        <UserAdminModal
          users={users}
          onAddUser={handleAddUser}
          onDeleteUser={handleDeleteUser}
          onUpdateUser={handleUpdateUser}
          onClose={() => setShowUserAdmin(false)}
        />
      )}
    </>
  );
}

/* ---------- référentiels ---------- */
const SECTEURS = {
  "Industrie": ["Agroalimentaire","Naval","Automobile","Aéronautique","Électronique","Textile","Chimie","Pharmaceutique","Métallurgie"],
  "Services": ["Numérique / Logiciel","Conseil","Ingénierie","Communication / Marketing","Immobilier","Éducation / Formation","Sécurité"],
  "Commerce & Distribution": ["Retail","E-commerce","Grande distribution","Import-export"],
  "Tourisme & Loisirs": ["Hôtellerie","Restauration","Événementiel","Nautisme","Sport"],
  "Transport & Logistique": ["Transport maritime","Transport routier","Aérien","Logistique / Entrepôts"],
  "Énergie & Environnement": ["Énergies renouvelables","Pétrole & Gaz","Traitement des déchets","Eau"],
  "Banque & Assurance": ["Banque","Assurance","FinTech"],
  "Secteur public & Associatif": ["Mairie / Collectivité","Université / École","Association / ONG"]
};

// Types d'actions disponibles (pour les listes déroulantes)
const ACTIONS = [
  { value: "Relance > Mail",         label: "Relance – Mail" },
  { value: "Relance > Téléphone",    label: "Relance – Téléphone" },
  { value: "Relance > LinkedIn",     label: "Relance – LinkedIn" },

  { value: "Rendez-vous > Visio",    label: "Rendez-vous – Visio" },
  { value: "Rendez-vous > Sur site", label: "Rendez-vous – Sur site" },

  { value: "Envoi > Devis",          label: "Envoi – Devis" },
  { value: "Envoi > Brochure",       label: "Envoi – Brochure" },

  { value: "Événement > Salon",      label: "Événement – Salon" },
  { value: "Événement > Webinaire",  label: "Événement – Webinaire" },

  { value: "Autre > Personnalisée",  label: "Autre – Personnalisée" },
];


/* Délai par type d’action (jours) */
const ACTION_DELAYS = {
  "Relance > Mail": 7,
  "Relance > Téléphone": 3,
  "Relance > LinkedIn": 5,
  "Rendez-vous > Visio": 14,
  "Rendez-vous > Sur site": 30,
  "Envoi > Devis": 10,
  "Envoi > Brochure": 7,
  "Événement > Salon": 30,
  "Événement > Webinaire": 14,
  "Autre > Personnalisée": 20
};

// Journal de bord : moyens & types d'action
const JB_CHANNELS = [
  "Courrier",
  "Mail",
  "Téléphone",
  "SMS",
  "LinkedIn",
  "Visio",
  "Sur site",
  "Devis"
];

const JB_ACTIONS = [
  "Envoi",
  "Relance",
  "Suivi",
  "Info"
];

/* Progress par statut */
const STAT_STEPS = ["En prospection","En cours","RDV planifié","Devis envoyé","Gagné","Perdu"];
const STAT_PROGRESS = (s)=>{
  const i = Math.max(0, STAT_STEPS.indexOf(s));
  return Math.round((i/(STAT_STEPS.length-1))*100);
};


/* ---------- store ---------- */
const store = {
  load: () => { try { return JSON.parse(localStorage.getItem("btv_liste")||"[]"); } catch { return []; } },
  save: (arr) => { try { localStorage.setItem("btv_liste", JSON.stringify(arr||[])); } catch {} },
  getLastAction: ()=>{
    try{ return JSON.parse(localStorage.getItem("btv_last_action")||"{}"); }catch{return {};}
  },
  setLastAction: (cat, sub)=>{
    try{ localStorage.setItem("btv_last_action", JSON.stringify({cat, sub})); }catch{}
  }
};

/* ---------- composant ---------- */
/* ========= MOBILE UI (début) ========= */
function MobileUI({
  entreprise,
  entreprises,
  setField,
  onSelectEntreprise,
  onNewEntreprise,
  onSaveEntreprise,
  onOpenContactModal,
  onQuickAction,
  onCreateRdv,
}) {
  const { useState, useMemo } = React;
  const [tab, setTab] = useState("list"); // "list" | "add" | "contacts" | "actions"
  const [search, setSearch] = useState("");
  const [note, setNote] = useState("");

  const filtered = useMemo(() => {
    const q = (search || "").toLowerCase().trim();
    if (!q) return entreprises;
    return (entreprises || []).filter((e) =>
      (e.nom || "").toLowerCase().includes(q)
    );
  }, [entreprises, search]);

  const hasEntreprise = entreprise && (entreprise.nom || "").trim();

  // dictée vocale (si dispo)
  const startDictation = () => {
    const SR =
      window.SpeechRecognition || window.webkitSpeechRecognition || null;
    if (!SR) {
      alert(
        "La dictée vocale n’est pas disponible sur ce navigateur. Essaie avec Chrome sur mobile 😉"
      );
      return;
    }
    const rec = new SR();
    rec.lang = "fr-FR";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const txt = e.results[0][0].transcript;
      setNote((prev) => (prev ? prev + " " + txt : txt));
    };
    rec.onerror = () => {
      alert("Erreur de reconnaissance vocale.");
    };
    rec.start();
  };

  const handleQuick = (kind) => {
    if (!hasEntreprise) {
      alert("Sélectionne d’abord une entreprise dans la liste.");
      return;
    }
    onQuickAction && onQuickAction(kind, note);
    setNote("");
  };

  const openRdv = () => {
    if (!hasEntreprise) {
      alert("Sélectionne d’abord une entreprise.");
      return;
    }
    onCreateRdv && onCreateRdv();
  };

  const renderList = () => (
    <div className="mobile-section">
      <h2 className="mobile-title">Entreprises</h2>
      <input
        className="mobile-input"
        placeholder="Rechercher une entreprise…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="mobile-list">
        {filtered.map((e) => (
          <button
            key={e.id || e.nom}
            className={
              "mobile-card" +
              (entreprise && e.id === entreprise.id ? " selected" : "")
            }
            onClick={() => {
              onSelectEntreprise && onSelectEntreprise(e);
              setTab("add");
            }}
          >
            <div className="mobile-card-main">
              <div className="mobile-card-name">{e.nom || "Sans nom"}</div>
              <div className="mobile-card-city">{e.ville || "Ville inconnue"}</div>
            </div>
            <div className="mobile-card-meta">
              <div className="mobile-chip">
                {e.statut || "En prospection"}
              </div>
              {e.prochaineAction && (
                <div className="mobile-next">
                  {e.prochaineAction}
                  {e.dateProchaine ? ` · ${e.dateProchaine}` : ""}
                </div>
              )}
            </div>
          </button>
        ))}
        {!filtered.length && (
          <p className="mobile-empty">Aucune entreprise trouvée.</p>
        )}
      </div>
    </div>
  );

  const renderAdd = () => (
    <div className="mobile-section">
      <h2 className="mobile-title">
        {entreprise.id ? "Fiche entreprise" : "Nouvelle entreprise"}
      </h2>

      <label>Nom de l’entreprise</label>
      <input
        className="mobile-input"
        value={entreprise.nom}
        onChange={(e) => setField("nom", e.target.value)}
        placeholder="ex. BORDE TA VOILE"
      />

      <label>Adresse</label>
      <input
        className="mobile-input"
        value={entreprise.adresse}
        onChange={(e) => setField("adresse", e.target.value)}
        placeholder="N°, Rue"
      />

      <label>Code postal</label>
      <input
        className="mobile-input"
        value={entreprise.codePostal}
        onChange={(e) => setField("codePostal", e.target.value)}
        placeholder="29620"
      />

      <label>Ville</label>
      <input
        className="mobile-input"
        value={entreprise.ville}
        onChange={(e) => setField("ville", e.target.value)}
        placeholder="Locquirec"
      />

      <label>E-mail</label>
      <input
        className="mobile-input"
        value={entreprise.email}
        onChange={(e) => setField("email", e.target.value)}
        placeholder="contact@entreprise.fr"
      />

      <label>Téléphone</label>
      <input
        className="mobile-input"
        value={entreprise.telephone}
        onChange={(e) => setField("telephone", e.target.value)}
        placeholder="02 00 00 00 00"
      />

      <label>Prochaine action</label>
      <input
        className="mobile-input"
        value={entreprise.prochaineAction || ""}
        onChange={(e) => setField("prochaineAction", e.target.value)}
        placeholder="ex. Relance téléphone"
      />

      <label>Date de relance</label>
      <input
        className="mobile-input"
        type="date"
        value={entreprise.dateProchaine || ""}
        onChange={(e) => setField("dateProchaine", e.target.value)}
      />

      <div className="mobile-actions-row">
        <button className="btn" onClick={onNewEntreprise}>
          Nouvelle fiche
        </button>
        <button className="btn cta" onClick={onSaveEntreprise}>
          Enregistrer
        </button>
      </div>
    </div>
  );

  const renderContacts = () => {
    const list = entreprise.contacts || [];
    const hasEntreprise = entreprise && (entreprise.nom || "").trim();

    return (
      <div className="mobile-section">
        <h2 className="mobile-title">
          Contacts {hasEntreprise ? `— ${entreprise.nom}` : ""}
        </h2>
        {!hasEntreprise && (
          <p className="mobile-empty">
            Sélectionne d’abord une entreprise dans l’onglet “Liste”.
          </p>
        )}

        {hasEntreprise && (
          <>
            <div className="mobile-list">
              {list.map((c) => {
                const fullName =
                  (c.prenom || "") + " " + (c.nom || "");
                return (
                  <div key={c.id} className="mobile-card">
                    <div className="mobile-card-main">
                      <div className="mobile-card-name">
                        {fullName.trim() || "Sans nom"}
                      </div>
                      {c.fonction && (
                        <div className="mobile-card-city">
                          {c.fonction}
                        </div>
                      )}
                    </div>
                    <div className="mobile-contacts-actions">
                      {c.tel && (
                        <a href={`tel:${c.tel}`} className="mobile-icon-btn">
                          📞
                        </a>
                      )}
                      {c.tel && (
                        <a href={`sms:${c.tel}`} className="mobile-icon-btn">
                          💬
                        </a>
                      )}
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          className="mobile-icon-btn"
                        >
                          ✉️
                        </a>
                      )}
                      {c.linkedin && (
                        <a
                          href={c.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="mobile-icon-btn"
                        >
                          💼
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
              {!list.length && (
                <p className="mobile-empty">
                  Aucun contact pour cette entreprise.
                </p>
              )}
            </div>

            <div className="mobile-actions-row">
              <button
                className="btn cta"
                onClick={() => onOpenContactModal && onOpenContactModal(null)}
              >
                + Ajouter un contact
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderActions = () => {
    const acts = (entreprise.activities || []).slice(0, 4);

    return (
      <div className="mobile-section">
        <h2 className="mobile-title">
          Suivi & actions {hasEntreprise ? `— ${entreprise.nom}` : ""}
        </h2>

        {!hasEntreprise && (
          <p className="mobile-empty">
            Sélectionne d’abord une entreprise dans l’onglet “Liste”.
          </p>
        )}

        {hasEntreprise && (
          <>
            {/* Dernières actions */}
            <div className="mobile-subtitle">Dernières actions</div>
            <div className="mobile-list">
              {acts.map((a) => (
                <div key={a.id} className="mobile-card">
                  <div className="mobile-card-main">
                    <div className="mobile-card-name">
                      {a.type}
                      {a.subType ? ` · ${a.subType}` : ""}
                    </div>
                    <div className="mobile-card-city">
                      {a.dateISO ? a.dateISO.slice(0, 10) : ""}
                    </div>
                  </div>
                  {a.note && (
                    <div className="mobile-card-note">{a.note}</div>
                  )}
                </div>
              ))}
              {!acts.length && (
                <p className="mobile-empty">
                  Aucune action pour l’instant.
                </p>
              )}
            </div>

            {/* Actions rapides */}
            <div className="mobile-subtitle">Ajouter une action rapide</div>
            <div className="mobile-quick-grid">
              <button
                className="btn mobile-quick"
                onClick={() => handleQuick("mail")}
              >
                ✉️ Mail
              </button>
              <button
                className="btn mobile-quick"
                onClick={() => handleQuick("tel")}
              >
                📞 Téléphone
              </button>
              <button
                className="btn mobile-quick"
                onClick={() => handleQuick("sms")}
              >
                💬 SMS
              </button>
              <button
                className="btn mobile-quick"
                onClick={() => handleQuick("linkedin")}
              >
                💼 LinkedIn
              </button>
            </div>

            <label>Note (optionnel)</label>
            <textarea
              className="mobile-input"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex : rappel téléphonique, interlocuteur, décision, etc."
            />

            <div className="mobile-actions-row">
              <button className="btn" type="button" onClick={startDictation}>
                🎙 Dicter
              </button>
              <button className="btn" type="button" onClick={openRdv}>
                📅 Rendez-vous
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  let content = null;
  if (tab === "list") content = renderList();
  else if (tab === "add") content = renderAdd();
  else if (tab === "contacts") content = renderContacts();
  else if (tab === "actions") content = renderActions();

  return (
    <div className="mobile-shell">
      {content}

      <nav className="mobile-nav">
        <button
          className={"mobile-nav-btn" + (tab === "list" ? " active" : "")}
          onClick={() => setTab("list")}
        >
          🔍<span>Liste</span>
        </button>
        <button
          className={"mobile-nav-btn" + (tab === "add" ? " active" : "")}
          onClick={() => setTab("add")}
        >
          ➕<span>Ajouter</span>
        </button>
        <button
          className={"mobile-nav-btn" + (tab === "contacts" ? " active" : "")}
          onClick={() => setTab("contacts")}
        >
          👤<span>Contacts</span>
        </button>
        <button
          className={"mobile-nav-btn" + (tab === "actions" ? " active" : "")}
          onClick={() => setTab("actions")}
        >
          🕓<span>Actions</span>
        </button>
      </nav>
    </div>
  );
}

/* ========= MOBILE UI (fin) ========= */

function GestionUI({ isMobile }) {
  const empty = {
    id:null,
    nom:"", adresse:"", codePostal:"", ville:"", distance:"",
    email:"", telephone:"",
    secteur:"", secteurCat:"", secteurSub:"",
    salaries:"", taille:"MIC",
    site:"", facebook:"", instagram:"",
    interet:3,
    dateDernier:"", prochaineAction:"", dateProchaine:"",
    prochaineActionCat:"", prochaineActionSub:"",
    montant:"",
    contacts:[],

    // infos RDV
    rdvDate:"",   // YYYY-MM-DD
    rdvHeure:"",  // HH:MM
    rdvLieu:"",   // texte libre (adresse, visio…)

    // suivi avancé
    activities: [],  // [{id,dateISO,type,subType,result,note}]
    statut: "En prospection"
  };

  const [entreprises, setEntreprises] = useState([]);
  const [entreprise, setEntreprise]   = useState(empty);

  /* Notes legacy supprimées dans V2 */

  /* UI states */
  const [editingNoteId] = useState(null); // laissé pour compatibilité (non utilisé)
  const [toast, setToast] = useState(""); // mini-toast
  const showToast = (txt)=>{ setToast(txt); setTimeout(()=>setToast(""), 1400); };

  /* Contacts modal */
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactDraft, setContactDraft] = useState({
    id:null,
    nom:"", prenom:"", fonction:"",
    tel:"", email:"", linkedin:"",
    statut:"actif", principal:false, lastISO:"", note:""
  });
  const [contactDirty, setContactDirty] = useState(false);

  /* Context menu contacts */
  const [contextMenu, setContextMenu] = useState({ visible:false, x:0, y:0, contact:null });

  /* Duplicates */
  const [dupCandidate, setDupCandidate] = useState(null);
  const [showDupModal, setShowDupModal] = useState(false);

  /* Timeline controls */
  const [actionCat, setActionCat] = useState(store.getLastAction().cat || "");
  const [actionSub, setActionSub] = useState(store.getLastAction().sub || "");
  const [actionResult, setActionResult] = useState("En cours");
  const [actionNote, setActionNote] = useState(""); // se vide auto après ajout
  const [jbChannel, setJbChannel] = useState("Mail");
  const [jbAction, setJbAction] = useState("Relance");
  const [showActionDetails, setShowActionDetails] = useState(false);
  const [tlFilterType, setTlFilterType] = useState("");
  const [tlFilterResult, setTlFilterResult] = useState("");
  const [tlOrder, setTlOrder] = useState("desc");
  const [tlCondensed, setTlCondensed] = useState(false);
  const [tlHideOld, setTlHideOld] = useState(false); // > 90j
  const [filtreSecteur, setFiltreSecteur] = useState("");
  const [filtreTaille, setFiltreTaille] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [filtreTexte, setFiltreTexte] = useState("");

  // Journal de bord (desktop)
  const [journalNote, setJournalNote] = useState("");

  /* Filtres liste entreprises */
  const [filterCat, setFilterCat] = useState("");
  const [filterSub, setFilterSub] = useState("");
  const [filterTaille, setFilterTaille] = useState("");  // NOUVEAU : filtre par taille
  const [filterThisWeek, setFilterThisWeek] = useState(false);

  /* Modale calendrier */
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);

    // Modale Agenda Google pour les rendez-vous
  const [showRdvCalendar, setShowRdvCalendar] = useState(false);

    // Modale de création de rendez-vous
  const [showRdvModal, setShowRdvModal] = useState(false);

// ---------- Données pour la liste de contacts (colonne du milieu) ----------
  // On s'assure d'avoir toujours un tableau, même si l'entreprise n'a pas encore de contacts
  const contacts = entreprise.contacts || [];

  // Quand on clique sur "Voir" dans la liste des contacts
  const selectContact = (c) => {
    if (!c) return;
    // On ouvre la modale de contact déjà prévue, en pré-remplissant avec ce contact
    openContactModal(c);
  };

  /* Exposer l'état courant au header / renderer */
  // Expose l'état courant SANS toucher window.btv (verrouillé par Electron)
  useEffect(()=>{
    window.btvUI = window.btvUI || {};
    window.btvUI.getCurrentEntreprise = () => entreprise;
    window.btvUI.getAllEntreprises   = () => entreprises;
  }, [entreprise, entreprises]);

  /* --------- lifecycle --------- */
  useEffect(() => {
    const sanitize = (arr=[]) => {
      // assigne des IDs manquants + filtre les entrées vides
      let id = 1;
      const withIds = (arr||[])
        .filter(e => (e && (e.nom||"").trim()))                // garde uniquement celles qui ont un nom
        .map(e => ({ id: Number(e.id)||id++, ...e }));         // id auto si manquant
      try { localStorage.setItem("btv_liste", JSON.stringify(withIds)); } catch {}
      return withIds;
    };

    const arr = sanitize(store.load());
    setEntreprises(arr);
    try{ window.dispatchEvent(new CustomEvent('btv:entreprisesChanged')); }catch{}

    // 👉 écoute un refresh externe (vider la base / import…)
    const onReload = () => setEntreprises(sanitize(store.load()));
    window.addEventListener('btv:entreprisesChanged', onReload);
    return () => window.removeEventListener('btv:entreprisesChanged', onReload);
  }, []);


  /* Notifications + bip sonore */
  useEffect(()=>{
    const requestPerm = async()=>{
      if ("Notification" in window && Notification.permission === "default"){
        try{ await Notification.requestPermission(); }catch{}
      }
    };
    requestPerm();

    const beep = () => {
      try{
        const ctx = new (window.AudioContext||window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = "sine"; o.frequency.value = 880; g.gain.value = 0.02;
        o.start();
        setTimeout(()=>{ o.stop(); ctx.close(); }, 180);
      }catch{}
    };

    const notifyRelances = (list)=>{
      const today = todayISO();
      list.filter(e => (e.dateProchaine||"") && e.dateProchaine <= today).forEach(e=>{
        if ("Notification" in window) new Notification("Relance à faire", { body: `${e.nom} – ${e.prochaineAction||"Action"} (${e.dateProchaine})` });
        beep();
      });
    };
    notifyRelances(entreprises);
    const t = setInterval(()=> notifyRelances(store.load()), 24*3600*1000);
    return ()=>clearInterval(t);
  }, [entreprises]);

  /* --------- helpers --------- */
  const setField = (name, value) => {
    setEntreprise(prev => {
      const up = { ...prev, [name]: value };

      if (name === "salaries") {
        const n = Number(value)||0;
        up.taille = n<=9 ? "MIC" : n<=49 ? "PET" : n<=249 ? "MOY" : "GDE";
      }
      if (name === "secteurCat" || name === "secteurSub") {
        const cat = name==="secteurCat" ? value : (prev.secteurCat||"");
        const sub = name==="secteurSub" ? value : (prev.secteurSub||"");
        up.secteurCat = cat; up.secteurSub = sub;
        up.secteur = [cat, sub].filter(Boolean).join(" > ");
      }
      if (name === "prochaineActionCat" || name === "prochaineActionSub") {
        const cat = name==="prochaineActionCat" ? value : (prev.prochaineActionCat||"");
        const sub = name==="prochaineActionSub" ? value : (prev.prochaineActionSub||"");
        up.prochaineActionCat = cat; up.prochaineActionSub = sub;
        up.prochaineAction = [cat, sub].filter(Boolean).join(" > ");
      }
      return up;
    });
  };

  const dist = Number(entreprise.distance);
  const coutAR = Number.isFinite(dist) && dist>0 ? (dist*2*COEF_KM).toFixed(2) : null;

  /* Fallback +20j quand dateDernier change sans règle */
  useEffect(() => {
    if (!entreprise.dateDernier) return;
    const base = new Date(entreprise.dateDernier+"T00:00:00");
    if (isNaN(base)) return;
    const cible = new Date(base.getTime() + 20*24*3600*1000);
    const iso  = cible.toISOString().slice(0,10);
    setEntreprise(prev => {
      if (!prev.dateProchaine || prev.dateProchaine < prev.dateDernier) {
        return { ...prev, dateProchaine: iso };
      }
      return prev;
    });
  }, [entreprise.dateDernier]);

  const findDuplicate = (e) => {
    const n=norm(e.nom), v=norm(e.ville), m=norm(e.email), s=norm(e.site);
    return entreprises.find(x=>{
      if (e.id && x.id===e.id) return false;
      const sameNomVille = norm(x.nom)===n && norm(x.ville)===v;
      const sameEmail = m && norm(x.email)===m;
      const sameSite  = s && norm(x.site)===s;
      return sameNomVille || sameEmail || sameSite;
    }) || null;
  };

  const nextId = () => {
    const ids = entreprises.map(e=>Number(e.id)).filter(Number.isFinite).sort((a,b)=>a-b);
    let i=1; for (const id of ids){ if(id===i) i++; else if(id>i) break; } return i;
  };

  const saveNow = () => {
    setEntreprises(prev=>{
      let arr;
      if (entreprise.id == null) {
        arr = [...prev, { ...entreprise, id: nextId() }];
        setEntreprise(empty);
      } else {
        arr = prev.map(e=> e.id===entreprise.id ? {...entreprise} : e);
      }
      store.save(arr);
      try{
        window.dispatchEvent(new CustomEvent('btv:entreprisesChanged'));
        window.dispatchEvent(new CustomEvent('btv:saved'));
      }catch{}
      return arr;
    });
  };

  const handleSave = () => {
    if (!entreprise.nom.trim()) return alert("Le nom de l’entreprise est requis.");
    const dup = findDuplicate(entreprise);
    if (dup){ setDupCandidate(dup); setShowDupModal(true); return; }
    saveNow();
  };
  const handleNew = () => { setEntreprise(empty); };
  const handleDelete = () => {
    // autorise la suppression même si id manquant en cherchant par nom+ville
    const target = entreprise.id != null
      ? (e)=> e.id !== entreprise.id
      : (e)=> !(norm(e.nom)===norm(entreprise.nom) && norm(e.ville)===norm(entreprise.ville));

    if (!entreprise.nom?.trim()) return alert("Aucune entreprise sélectionnée.");
    if (!confirm(`Supprimer "${entreprise.nom}" ?`)) return;

    setEntreprises(prev=>{
      const arr = prev.filter(target);
      store.save(arr);
      try{
        window.dispatchEvent(new CustomEvent('btv:entreprisesChanged'));
        window.dispatchEvent(new CustomEvent('btv:saved'));
      }catch{}
      return arr;
    });
    setEntreprise(empty);
  };

  const handleDupRefresh  = () => { if(dupCandidate) setEntreprise(prev=>({ ...prev, ...dupCandidate, id:dupCandidate.id })); setShowDupModal(false); };
  const handleDupContinue = () => { setShowDupModal(false); saveNow(); };

  /* ---------- Contacts ---------- */
  const openContactModal = (c=null) => {
    setContactDraft(c ? {
      id: c.id,
      nom: c.nom||"", prenom: c.prenom||"", fonction: c.fonction||"",
      tel: c.tel||"", email: c.email||"", linkedin: c.linkedin||"",
      statut: c.statut||"actif", principal: !!c.principal,
      lastISO: c.lastISO||"", note: c.note||""
    } : {
      id:null, nom:"", prenom:"", fonction:"",
      tel:"", email:"", linkedin:"",
      statut:"actif", principal:false, lastISO:"", note:""
    });
    setShowContactModal(true);
    setContactDirty(false);
  };
  const isEmail = (s)=> /^\S+@\S+\.\S+$/.test(String(s||"").trim());
  const isPhone = (s)=> /[0-9]{6,}/.test(String(s||"").replace(/\D/g,""));
  const cleanLinkedIn = (url) => {
    const u = String(url||"").trim();
    if (!u) return "";
    const withProto = /^https?:\/\//i.test(u) ? u : "https://"+u;
    try {
      const x = new URL(withProto);
      if (!/linkedin\.com$/i.test(x.hostname)) return withProto;
      x.search = ""; x.hash = "";
      return x.toString();
    } catch { return withProto; }
  };
  useEffect(()=>{ if (showContactModal) setContactDirty(true); }, [contactDraft, showContactModal]);
  const closeContactModal = () => {
    if (contactDirty) { const ok = confirm("Des modifications non enregistrées seront perdues. Fermer malgré tout ?"); if (!ok) return; }
    setShowContactModal(false); setContactDirty(false);
  };
  const saveContact = () => {
    const draft = {
      ...contactDraft,
      email: contactDraft.email?.trim(),
      tel: (contactDraft.tel||"").trim(),
      linkedin: cleanLinkedIn(contactDraft.linkedin)
    };
    setEntreprise(prev=>{
      const list = [...(prev.contacts||[])];
      const duplicate = list.some(x =>
        (draft.id ? x.id !== draft.id : true) &&
        (
          (!!draft.email && !!x.email && norm(draft.email) === norm(x.email)) ||
          (!!draft.tel   && !!x.tel   && draft.tel.replace(/\D/g,"") === String(x.tel||"").replace(/\D/g,""))
        )
      );
      if (duplicate) { alert("Un contact avec le même e-mail ou le même téléphone existe déjà."); return prev; }
      let created = false;
      if (draft.id) {
        const i = list.findIndex(x=>x.id===draft.id);
        if (i>=0) list[i] = { ...list[i], ...draft };
      } else {
        draft.id = Date.now();
        list.push(draft);
        created = true;
      }
      if (draft.principal) list.forEach(x => { x.principal = (x.id === draft.id); });

      const activities = [
        { id: Date.now()+1, dateISO: new Date().toISOString(), type: "Autre", subType: "Contact", result: "OK", note: `${created ? "Contact ajouté" : "Contact modifié"} : ${(draft.nom+" "+draft.prenom).trim()||"Sans nom"}` },
        ...(prev.activities||[])
      ];
      showToast(draft.id ? "✔ Contact enregistré" : "✔ Contact ajouté");
      setShowContactModal(false);
      setContactDirty(false);
      return { ...prev, contacts:list, activities };
    });
  };
  const deleteContact = () => {
    if (!contactDraft.id) return setShowContactModal(false);
    setEntreprise(prev=>({ ...prev, contacts:(prev.contacts||[]).filter(c=>c.id!==contactDraft.id) }));
    setShowContactModal(false);
  };

   /* ---------- Actions / timeline ---------- */
const addActivity = ({ type, subType = "", result = "En cours", note = "" }) => {  
  const nowISO = new Date().toISOString();
    setEntreprise(prev => {
      const acts = [{ id: Date.now(), dateISO: nowISO, type, subType, result, note }, ...(prev.activities||[])];
      const key = [type, subType].filter(Boolean).join(" > ");
      const nextDays = ACTION_DELAYS[key] ?? 20;
      const nextISO = new Date(Date.now()+ nextDays*864e5).toISOString().slice(0,10);

      let statut = prev.statut || "En prospection";
      if (type === "Rendez-vous") statut = "RDV planifié";
      if (type === "Envoi" && subType === "Devis") statut = "Devis envoyé";
      if (type === "Relance") statut = "En cours"; // ✅ nouveau libellé

      return {
        ...prev,
        activities: acts,
        dateDernier: nowISO.slice(0,10),
        dateProchaine: prev.dateProchaine || nextISO,
        statut
      };
    });

      const fireJournalEntry = () => {
    if (!jbAction || !jbChannel) return;
    addActivity({
      type: jbAction,
      subType: jbChannel,
      note: journalNote.trim()
    });
    setJournalNote("");
  };


    // préférences + feedback
    store.setLastAction(type, subType);
    setActionCat(type);
    setActionSub(subType);
    setActionResult(result);
    setActionNote(""); // vider automatiquement
    showToast("Action ajoutée ✅");
  };

  // Journal de bord : transforme (moyen + type) en vraie action
  const fireJournalEntry = () => {
    if (!jbChannel || !jbAction) {
      alert("Choisis un moyen de contact et un type d’action.");
      return;
    }

    const channel = jbChannel;
    const action = jbAction;
    let type = "Autre";
    let subType = "";

    if (channel === "Visio" || channel === "Sur site") {
      type = "Rendez-vous";
      subType = channel;
    } else if (channel === "Devis") {
      type = "Envoi";
      subType = "Devis";
    } else if (action === "Envoi") {
      type = "Envoi";
      subType = channel;
    } else if (action === "Relance" || action === "Suivi") {
      type = "Relance";
      subType = channel;
    } else {
      type = "Autre";
      subType = channel;
    }

    const note = `${action} · ${channel}`;
    addActivity({ type, subType, result: "En attente", note });
  };

  // Supprimer une action de la timeline
  const deleteActivity = (id) => {
    setEntreprise(prev => ({
      ...prev,
      activities: (prev.activities || []).filter(a => a.id !== id)
    }));
  };

  /* Résumé du suivi (comptes) */
  const resume = useMemo(()=>{
    const r = { Relance:0, RendezVous:0, Devis:0, Evenement:0, Autre:0 };
    (entreprise.activities||[]).forEach(a=>{
      if (a.type === "Relance") r.Relance++;
      else if (a.type === "Rendez-vous") r.RendezVous++;
      else if (a.type === "Envoi" && a.subType==="Devis") r.Devis++;
      else if (a.type === "Événement") r.Evenement++;
      else r.Autre++;
    });
    return r;
  }, [entreprise.activities]);

  /* Filtrage / tri / masquage timeline */
  const filteredTimeline = useMemo(()=>{
    let arr = [...(entreprise.activities||[])];
    if (tlFilterType) arr = arr.filter(a=>a.type===tlFilterType);
    if (tlFilterResult) arr = arr.filter(a=>(a.result||"").toLowerCase() === tlFilterResult.toLowerCase());
    if (tlHideOld){
      const limit = Date.now()-90*864e5;
      arr = arr.filter(a=> new Date(a.dateISO).getTime() >= limit);
    }
    arr.sort((a,b)=> tlOrder==="asc" ? new Date(a.dateISO)-new Date(b.dateISO) : new Date(b.dateISO)-new Date(a.dateISO));
    return arr;
  }, [entreprise.activities, tlFilterType, tlFilterResult, tlOrder, tlHideOld]);

    // URL du mini-agenda centré autour de la date choisie
  const miniAgendaUrl = useMemo(() => {
    if (!entreprise.rdvDate) return "";

    try {
      const d1 = new Date(entreprise.rdvDate + "T00:00:00");
      const d2 = new Date(d1.getTime() + 7 * 864e5); // +7 jours

      const start = d1.toISOString().slice(0, 10).replace(/-/g, "");
      const end   = d2.toISOString().slice(0, 10).replace(/-/g, "");

      // Vue semaine autour de la date choisie
      return `${G_CAL_EMBED_BASE}&mode=WEEK&dates=${start}/${end}`;
    } catch {
      return G_CAL_EMBED_BASE;
    }
  }, [entreprise.rdvDate]);


  /* Filtres liste entreprises et indicateurs */
  const filteredEntreprises = useMemo(()=>{
    const start = new Date();
    const end = new Date(Date.now()+7*864e5);
    const inThisWeek = (d)=>{
      if (!d) return false;
      const dt = new Date(d+"T00:00:00");
      return dt >= new Date(start.toDateString()) && dt <= end;
    };
    return entreprises.filter(e=>{
      if (filterCat && e.prochaineActionCat !== filterCat) return false;
      if (filterSub && e.prochaineActionSub !== filterSub) return false;
      if (filterTaille && String(e.taille || "").toUpperCase() !== filterTaille) return false;
      if (filterThisWeek && !inThisWeek(e.dateProchaine||"")) return false;
      return true;
    });
  }, [entreprises, filterCat, filterSub, filterTaille, filterThisWeek]);

  const isOverdue = (e)=> e.dateProchaine && e.dateProchaine < todayISO();
  const isDueToday = (e)=> e.dateProchaine && e.dateProchaine === todayISO();

  /* --- helpers CSV + export --- */
  const CSV_HEADERS = [
    "id","nom","adresse","codePostal","ville","distance","email","telephone",
    "secteur","secteurCat","secteurSub","salaries","taille","site","facebook","instagram",
    "interet","dateDernier","dateProchaine","prochaineAction","prochaineActionCat","prochaineActionSub",
    "montant","statut",
    "contact_nom","contact_prenom","contact_fonction","contact_tel","contact_email","contact_linkedin",
    "contact_statut","contact_principal","contact_lastISO","contact_note"
  ];

  // Toujours mettre entre guillemets et doubler les guillemets internes (compat Excel)
  const q = (v) => {
    const s = (v ?? "").toString();
    return `"${s.replace(/"/g, '""')}"`;
  };

  const buildCsvRows = (arr=[]) => {
    const rows = [];
    for (const e of arr) {
      const contacts = (e.contacts && e.contacts.length) ? e.contacts : [ {} ];
      for (const c of contacts) {
        rows.push([
          e.id ?? "", e.nom ?? "", e.adresse ?? "", e.codePostal ?? "", e.ville ?? "", e.distance ?? "",
          e.email ?? "", e.telephone ?? "",
          e.secteur ?? "", e.secteurCat ?? "", e.secteurSub ?? "", e.salaries ?? "", e.taille ?? "",
          e.site ?? "", e.facebook ?? "", e.instagram ?? "",
          e.interet ?? "", e.dateDernier ?? "", e.dateProchaine ?? "", e.prochaineAction ?? "",
          e.prochaineActionCat ?? "", e.prochaineActionSub ?? "",
          e.montant ?? "", e.statut ?? "",
          (c?.nom ?? ""), (c?.prenom ?? ""), (c?.fonction ?? ""), (c?.tel ?? ""), (c?.email ?? ""), (c?.linkedin ?? ""),
          (c?.statut ?? ""), (c?.principal ? "1" : "0"), (c?.lastISO ?? ""), (c?.note ?? "")
        ]);
      }
    }
    return rows;
  };

  const exportCSV = () => {
    // Utilise l’état local
    const data = buildCsvRows(entreprises);
    const header = CSV_HEADERS.map(q).join(";");
    const body   = data.map(r => r.map(q).join(";")).join("\r\n");
    // BOM pour Excel + encodage UTF-8
    const csv = "\uFEFF" + header + "\r\n" + body;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const d = new Date().toISOString().slice(0,10);
    a.href = url;
    a.download = `entreprises_export_${d}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  /* Bouton Relancer aujourd’hui */
  const relancerAuj = () => {
    const cat = entreprise.prochaineActionCat || actionCat || "Relance";
    const sub = entreprise.prochaineActionSub || actionSub || "Mail";
    const key = [cat, sub].filter(Boolean).join(" > ");
    const nextDays = ACTION_DELAYS[key] ?? 7;

    setEntreprise(prev => ({
      ...prev,
      dateDernier: todayISO(),
      dateProchaine: new Date(Date.now() + nextDays * 864e5)
        .toISOString()
        .slice(0, 10)
    }));

    addActivity({
      type: cat,
      subType: sub,
      result: "En attente",
      note: "Relance programmée aujourd’hui"
    });
  };

/* Bouton Rendez-vous :
 * - ajoute une action dans la timeline
 * - ouvre la fenêtre "Créer un événement" dans Google Agenda (compte n°2)
 */
const openGCalRdv = () => {
  if (!entreprise.nom) {
    alert("Sélectionne d’abord une entreprise avant de créer un rendez-vous.");
    return;
  }

  if (!entreprise.rdvDate) {
    alert("Renseigne d’abord la date du rendez-vous.");
    return;
  }

  if (!entreprise.rdvHeure) {
    alert("Renseigne aussi l’heure du rendez-vous.");
    return;
  }

  // 1) Ajout dans la timeline
  const noteParts = [`RDV le ${entreprise.rdvDate}`, `à ${entreprise.rdvHeure}`];
  if (entreprise.rdvLieu) noteParts.push(`– ${entreprise.rdvLieu}`);

  addActivity({
    type: "Rendez-vous",
    subType: entreprise.rdvLieu || "À définir",
    result: "En cours",
    note: noteParts.join(" ")
  });

  // 2) Construction de l’URL Google Agenda (compte n°2 => /u/1/)
  const makeDateTime = (dateStr, timeStr) => {
    // dateStr = "YYYY-MM-DD", timeStr = "HH:MM"
    const [y, m, d] = dateStr.split("-");
    if (!timeStr) return `${y}${m}${d}`;
    const [hh, mm] = timeStr.split(":");
    return `${y}${m}${d}T${hh}${mm}00`;
  };

  const startDT = makeDateTime(entreprise.rdvDate, entreprise.rdvHeure);

  // Fin = +1h par défaut
  let endDT = startDT;
  try {
    const d = new Date(entreprise.rdvDate + "T" + entreprise.rdvHeure + ":00");
    d.setHours(d.getHours() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    endDT = `${y}${m}${day}T${hh}${mm}00`;
  } catch {}

  const title = `RDV ${entreprise.nom}`;
  const details = `Rendez-vous avec ${entreprise.nom}${
    entreprise.contacts?.length
      ? ` (contact : ${entreprise.contacts[0].prenom || ""} ${entreprise.contacts[0].nom || ""})`
      : ""
  }`;
  const location = entreprise.rdvLieu || "";

  const params = new URLSearchParams({
    text: title,
    dates: `${startDT}/${endDT}`,
    details,
    location
  });

  const url = `https://calendar.google.com/calendar/u/1/r/eventedit?${params.toString()}`;
  window.open(url, "_blank", "noopener");
};

    /* ---------- calendrier (modale) ---------- */
  const monthInfo = (offset = 0) => {
    const ref = new Date();
    ref.setMonth(ref.getMonth() + offset);
    const year = ref.getFullYear();
    const month = ref.getMonth(); // 0-11
    const first = new Date(year, month, 1);
    const startDay = (first.getDay() + 6) % 7; // Lundi = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return {
      year,
      month,
      startDay,
      daysInMonth,
      label: ref.toLocaleString("fr-FR", { month: "long", year: "numeric" }),
    };
  };

  /* ---------- render ---------- */
const isMobileScreen =
  isMobile ||
  (typeof window !== "undefined" &&
    window.innerWidth &&
    window.innerWidth <= 700);

if (isMobileScreen) {
  return (
    <MobileUI
      entreprise={entreprise}
      entreprises={entreprises}
      setField={setField}
      onSelectEntreprise={(e) => setEntreprise(e)}
      onNewEntreprise={handleNew}
      onSaveEntreprise={handleSave}
      onOpenContactModal={openContactModal}
      onQuickAction={mobileQuickAction}
      onCreateRdv={openMobileRdv}
    />
  );
}
  return (
  <div className="app-grid">

    {/* ------------ COLONNE GAUCHE : FICHE ENTREPRISE ------------ */}
    <section className="left">
      <div className="card fill">
        <div className="card-header">
          <h2 className="card-title">Information Entreprise</h2>
        </div>

        <div className="card-body">
          <div className="cols-2">

            {/* ----------- COLONNE 1 ----------- */}
            <div>
              <label>Nom de l’entreprise</label>
              <input
                value={entreprise.name || ""}
                onChange={(e) => setField("name", e.target.value)}
              />

              <label>Adresse</label>
              <input
                value={entreprise.address || ""}
                onChange={(e) => setField("address", e.target.value)}
              />

              <label>Code postal</label>
              <input
                value={entreprise.zip || ""}
                onChange={(e) => setField("zip", e.target.value)}
              />

              <label>Ville</label>
              <input
                value={entreprise.city || ""}
                onChange={(e) => setField("city", e.target.value)}
              />

              <label>Secteur</label>
              <select
                value={entreprise.sector || ""}
                onChange={(e) => setField("sector", e.target.value)}
              >
                <option value="">-- Choisir un secteur --</option>

                {Object.entries(SECTEURS).map(([categorie, sousSecteurs]) => (
                  <optgroup key={categorie} label={categorie}>
                    {sousSecteurs.map((nom) => (
                      <option key={`${categorie}-${nom}`} value={nom}>
                        {nom}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* ----------- COLONNE 2 ----------- */}
            <div>
              <label>Site web</label>
              <div className="row">
                <input
                  value={entreprise.website || ""}
                  onChange={(e) => setField("website", e.target.value)}
                />
                <button
                  className="btn small"
                  onClick={() => openURL(entreprise.website)}
                >
                  Ouvrir
                </button>
              </div>

              <label>Distance (km)</label>
              <input
                value={entreprise.distance || ""}
                onChange={(e) => setField("distance", e.target.value)}
              />

              <label>Notes</label>
              <textarea
                value={entreprise.notes || ""}
                onChange={(e) => setField("notes", e.target.value)}
                rows={6}
              />
            </div>

          </div>
        </div>

        <div className="card-footer row">
          <button className="btn" onClick={handleNew}>Nouveau</button>
          <button className="btn cta" onClick={handleSave}>Enregistrer</button>
        </div>
      </div>
    </section>

{/* ------------ COLONNE DROITE BASSE : CONTACTS ------------ */}
    <section className="right-under">
      <div className="card fill">
        <div className="card-header row space-between">
          <h2 className="card-title">Contacts</h2>
          <button className="btn small" onClick={openContactModal}>Ajouter</button>
        </div>

        <div className="card-body">
          {contacts.length === 0 && (
            <p className="empty">Aucun contact pour cette entreprise.</p>
          )}

          {contacts.length > 0 && (
            <ul className="contact-list">
              {contacts.map((c) => {
                const fullName = `${c.prenom || ""} ${c.nom || ""}`.trim() || "Sans nom";
                return (
                  <li key={c.id} className="contact-item">
                    <div>
                      <strong>{fullName}</strong>
                      {c.fonction && <div className="small">{c.fonction}</div>}
                      {c.tel && <div className="small">{c.tel}</div>}
                      {c.email && <div className="small">{c.email}</div>}
                    </div>
                    <button className="btn small" onClick={() => selectContact(c)}>
                      Voir
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>

{/* ------------ COLONNE DROITE : SUIVI + JOURNAL ------------ */}
<section className="right">
  <div className="card fill">
    <div className="card-header">
      <h2 className="card-title">
        Suivi du démarchage
        <span className="badge pill" style={{ marginLeft: 8 }}>
          {entreprise.statut || "En prospection"}
        </span>
      </h2>
    </div>

    <div className="card-body">
      {/* Résumé + stats */}
      <div className="resume-row">
        <div className="badges">
          <span className="badge pill">Relances : {resume.Relance}</span>
          <span className="badge pill">RDV : {resume.RendezVous}</span>
          <span className="badge pill">Devis : {resume.Devis}</span>
          <span className="badge pill">Événements : {resume.Evenement}</span>
        </div>
      </div>

      <label className="mt12">Dernière action</label>
      <input
        readOnly
        value={entreprise.prochaineAction || "Aucune action pour l’instant."}
      />

      <label>Date de dernière action</label>
      <input
        type="date"
        readOnly
        value={entreprise.dateDernier || ""}
      />

      <label>Prochaine relance</label>
      <input
        type="date"
        readOnly
        value={entreprise.dateProchaine || ""}
      />

      <label className="mt12">Montant potentiel (€)</label>
      <input
        value={entreprise.montant || ""}
        onChange={(e) => setField("montant", e.target.value)}
        placeholder="Montant du sponsoring"
      />

      {/* --- Journal de bord : moyens + types --- */}
      <h3 className="mt16">Journal de bord</h3>
      <p className="hint">
        Choisis un moyen de contact et un type d’action, puis clique sur
        « Ajouter au journal ».
      </p>

      {/* Moyens : Courrier / Mail / Téléphone / ... */}
      <div className="chips-row">
        {JB_CHANNELS.map((ch) => (
          <button
            key={ch}
            type="button"
            className={"chip" + (jbChannel === ch ? " chip-active" : "")}
            onClick={() => setJbChannel(ch)}
          >
            {ch}
          </button>
        ))}
      </div>

      {/* Types : Envoi / Relance / Suivi / Info */}
      <div className="chips-row mt8">
        {JB_ACTIONS.map((act) => (
          <button
            key={act}
            type="button"
            className={"chip" + (jbAction === act ? " chip-active" : "")}
            onClick={() => setJbAction(act)}
          >
            {act}
          </button>
        ))}
      </div>

      <label className="mt12">Note / détail de l’action</label>
      <textarea
        value={journalNote}
        onChange={(e) => setJournalNote(e.target.value)}
        placeholder="Ex. Relance mail suite au salon..."
        rows={3}
      />

      <div className="mt8">
        <button
          type="button"
          className="btn cta"
          onClick={fireJournalEntry}
        >
          + Ajouter au journal
        </button>
      </div>

      {/* Historique */}
      <h3 className="mt16">Historique des actions</h3>
      <div className="timeline">
        {(entreprise.activities || [])
          .slice()
          .reverse()
          .map((a) => (
            <div key={a.id} className="tl-item">
              <div className="tl-date">{a.dateISO?.slice(0, 10) || "?"}</div>
              <div className="tl-main">
                <strong>{a.type}</strong> via {a.subType}
                {a.note && <div className="tl-note">{a.note}</div>}
              </div>
            </div>
          ))}
        {!(entreprise.activities || []).length && (
          <div>Aucune action pour l’instant.</div>
        )}
      </div>
    </div>
  </div>
</section>

          {/* Journal de bord : choix rapide du moyen + type */}
      <h3 className="mt16">Journal de bord</h3>

      <div className="chips-row">
        {JB_CHANNELS.map((ch) => (
          <button
            key={ch}
            type="button"
            className={
              "chip" + (jbChannel === ch ? " chip-active" : "")
            }
            onClick={() => setJbChannel(ch)}
          >
            {ch}
          </button>
        ))}
      </div>

      <div className="chips-row mt8">
        {JB_ACTIONS.map((act) => (
          <button
            key={act}
            type="button"
            className={
              "chip" + (jbAction === act ? " chip-active" : "")
            }
            onClick={() => setJbAction(act)}
          >
            {act}
          </button>
        ))}
      </div>

      <div className="mt8">
        <button
          type="button"
          className="btn small"
          onClick={fireJournalEntry}
        >
          Ajouter au journal
        </button>
      </div>


                    {/* ------------ BLOC BAS : LISTE DES ENTREPRISES ------------ */}
    <section className="bottom">
      <div className="card">
        <div className="card-header row space-between">
          <h2 className="card-title">Entreprises</h2>
          <div className="row gap8">
            <button className="btn small" onClick={handleNew}>Nouveau</button>
            <button className="btn small" onClick={exportCSV}>Exporter CSV</button>
          </div>
        </div>

        <div className="card-body">
          {/* Filtres */}
          <div className="row gap8 wrap mb12">
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
            >
              <option value="">Toutes les catégories</option>
              {Object.keys(ACTIONS).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={filterSub}
              onChange={(e) => setFilterSub(e.target.value)}
              disabled={!filterCat}
            >
              <option value="">Toutes les actions</option>
              {filterCat && (ACTIONS[filterCat] || []).map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>

            <select
              value={filterTaille}
              onChange={(e) => setFilterTaille(e.target.value)}
            >
              <option value="">Toutes les tailles</option>
              <option value="MIC">MIC</option>
              <option value="PME">PME</option>
              <option value="ETI">ETI</option>
              <option value="GE">GE</option>
            </select>

            <label className="chk-inline">
              <input
                type="checkbox"
                checked={filterThisWeek}
                onChange={(e) => setFilterThisWeek(e.target.checked)}
              />
              À relancer cette semaine
            </label>
          </div>

          {/* Tableau des entreprises */}
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Ville</th>
                  <th>Secteur</th>
                  <th>Taille</th>
                  <th>Prochaine action</th>
                  <th>Prochaine date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntreprises.map((e) => (
                  <tr
                    key={e.id}
                    className={
                      e.id === entreprise.id
                        ? "selected"
                        : isOverdue(e)
                          ? "overdue"
                          : isDueToday(e)
                            ? "today"
                            : ""
                    }
                    onClick={() => selectEntreprise(e.id)}
                  >
                    <td>{e.nom || "(Sans nom)"}</td>
                    <td>{e.ville || ""}</td>
                    <td>{e.secteur || ""}</td>
                    <td>{e.taille || ""}</td>
                    <td>{e.prochaineAction || ""}</td>
                    <td>{e.dateProchaine || ""}</td>
                    <td>
                      <button
                        className="btn small danger"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          deleteEntreprise(e.id);
                        }}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredEntreprises.length === 0 && (
                  <tr>
                    <td colSpan={7}>Aucune entreprise pour ces filtres.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    {/* ------------ TOAST ------------ */}
    {toast && <div className="toast">{toast}</div>}
  </div>
);
}

// Exposer pour le renderer si besoin
try { window.GestionUI = GestionUI; } catch {}

// Montage résistant + logs
(() => {
  try {
    const el = document.getElementById('app');
    if (!el) throw new Error('#app introuvable');
    if (!el.__hasApp) {
      if (!window.React || !window.ReactDOM) throw new Error('React/ReactDOM non chargés');
      console.log('[BTV] Tentative de montage React…');
      const root = ReactDOM.createRoot(el);
      root.render(React.createElement(App));   // <== ici
      el.__hasApp = true;
      console.log('[BTV] React monté');
      window.dispatchEvent(new CustomEvent('btv:ui-mounted'));
    }
  } catch (err) {
    console.error('Mount error:', err);
    try {
      const box = document.getElementById('bootlog');
      if (box) { box.style.display='block'; box.textContent = 'Mount error: ' + err.message; }
    } catch {}
    }
})();