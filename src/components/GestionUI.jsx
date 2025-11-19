/* ==== src/components/GestionUI.jsx (V2.2 – Export CSV + filtre par taille) ==== */
const { useState, useEffect, useMemo } = React;

// Ecran de connexion simple (à améliorer plus tard si besoin)
function LoginScreen({ users, onLogin, onCreateFirstUser, onRegisterRequest }) {
  return (
    <div className="login-screen">
      <h1>BORDE TA VOILE</h1>
      <p>Connexion en cours de mise en place.</p>

      <div style={{ marginTop: "1rem" }}>
        {/* Bouton pour créer le premier utilisateur si aucun compte */}
        {users && users.length === 0 && onCreateFirstUser && (
          <button onClick={onCreateFirstUser}>
            Créer mon premier compte
          </button>
        )}

        {/* Bouton pour se connecter avec un utilisateur existant */}
        {users && users.length > 0 && onLogin && (
          <button
            onClick={() => onLogin(users[0])}
            style={{ marginLeft: "0.5rem" }}
          >
            Continuer
          </button>
        )}

        {/* Lien pour demander une inscription si tu veux l’utiliser plus tard */}
        {onRegisterRequest && (
          <button
            onClick={onRegisterRequest}
            style={{ marginLeft: "0.5rem" }}
          >
            Demander un accès
          </button>
        )}
      </div>
    </div>
  );
}

function useIsMobile() {
  /* ---------- Supabase (auth utilisateurs) ---------- */
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

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 700px)").matches
      : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 700px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}


// URL d’intégration Google Calendar (embed de bordetavoile@gmail.com)
const G_CAL_EMBED_BASE =
  "https://calendar.google.com/calendar/embed?src=bordetavoile%40gmail.com&ctz=Europe%2FParis";


/* ---------- helpers ---------- */
const COEF_KM = 0.665;
const ensureHttp = (u) => !u ? "" : (/^https?:\/\//i.test(String(u).trim()) ? String(u).trim() : "https://" + String(u).trim());
const openURL = (u) => {
  const url = ensureHttp(u);
  if (!url) return;
  if (window.btv?.openExternal) window.btv.openExternal(url);
  else window.open(url, "_blank", "noopener");
};
const norm = (s) => (s || "").toString().trim().toLowerCase();
const todayISO = () => new Date().toISOString().slice(0,10);

/* ---- Modale de gestion des utilisateurs (admin uniquement) ---- */
function UserAdminModal({ users, onAddUser, onDeleteUser, onUpdateUser, onClose }) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState("user");

    const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("Nom, e-mail et mot de passe sont requis.");
      return;
    }
    // on laisse la création réelle à App (userApi.addUserAdmin)
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
      <div className="modal solid" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Gestion des utilisateurs</h3>
          <button className="btn small" onClick={onClose}>Fermer</button>
        </div>

        <h4>Utilisateurs existants</h4>
        <ul className="user-list">
          {users.map(u => (
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
                    onClick={() => onUpdateUser({ ...u, status: "active" })}
                  >
                    Valider
                  </button>
                )}

                {(u.status || "active") === "active" && (
                  <button
                    className="btn small"
                    onClick={() => onUpdateUser({ ...u, status: "disabled" })}
                  >
                    Désactiver
                  </button>
                )}

                {(u.status || "active") === "disabled" && (
                  <button
                    className="btn small"
                    onClick={() => onUpdateUser({ ...u, status: "active" })}
                  >
                    Réactiver
                  </button>
                )}
                <button
                  className="btn small danger"
                  onClick={() => {
                    if (confirm(`Supprimer l'utilisateur "${u.name}" ?`)) {
                      onDeleteUser(u.id);
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

        <hr style={{margin: "12px 0"}} />

        <h4>Ajouter un utilisateur</h4>
        <form onSubmit={handleAdd} className="modal-grid">
          <div>
            <label>Nom</label>
            <input value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div>
            <label>E-mail</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div>
            <label>Rôle</label>
            <select value={role} onChange={e=>setRole(e.target.value)}>
              <option value="user">Utilisateur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          <div>
            <label>Mot de passe</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          <div className="modal-actions centered" style={{gridColumn: "1 / -1"}}>
            <button type="submit" className="btn cta">Ajouter</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---- App racine : gère login + GestionUI ---- */
function App() {
  const [users, setUsers] = useState(() => userStore.loadUsers());
  const [currentUser, setCurrentUser] = useState(() => userStore.getCurrent());
  const [showUserAdmin, setShowUserAdmin] = useState(false);
  const isMobile = useIsMobile();

  // Ajouter / enlever la classe logged-out sur le <body>
  useEffect(() => {
    if (currentUser) {
      document.body.classList.remove("logged-out");
    } else {
      document.body.classList.add("logged-out");
    }
  }, [currentUser]);

  // Sauvegarde des utilisateurs dans le localStorage
  useEffect(() => {
    userStore.saveUsers(users);
  }, [users]);

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

  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleCreateFirstUser = (user) => {
    setUsers([user]);
    setCurrentUser(user);
  };

  const handleRegisterRequest = (user) => {
    // simple ajout, le compte reste non connecté et en "pending"
    setUsers((prev) => [...prev, user]);
  };

  const handleUpdateUser = (user) => {
    setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
    setCurrentUser((cur) => (cur && cur.id === user.id ? user : cur));
  };

  const handleAddUser = (user) => {
    setUsers((prev) => [...prev, user]);
  };

  const handleDeleteUser = (id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setCurrentUser((cur) => (cur && cur.id === id ? null : cur));
  };

  const handleLogout = () => {
    if (!confirm("Se déconnecter ?")) return;
    setCurrentUser(null);
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

const ACTIONS = {
  "Relance": ["Mail", "Téléphone", "LinkedIn"],
  "Rendez-vous": ["Visio", "Sur site"],
  "Envoi": ["Devis", "Brochure"],
  "Événement": ["Salon", "Webinaire"],
  "Autre": ["Personnalisée"]
};

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
function MobileUI({ entreprise, setField }) {
  return (
    <div className="mobile-wrapper">
      <h2>📱 Mode mobile</h2>
      <p>Ici tu peux construire une interface simplifiée pour téléphone.</p>

      <label>Nom de l’entreprise</label>
      <input
        value={entreprise.nom}
        onChange={e => setField("nom", e.target.value)}
      />

      {/* Ajoute ici les blocs que tu veux afficher sur mobile */}
    </div>
  );
}
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
  if (isMobile) {
  return <MobileUI entreprise={entreprise} setField={setField} />;
}

  return (
    <div className="app-grid">
      {/* LEFT */}
      <section className="left">
        <div className="card fill">
          <div className="card-header"><h2 className="card-title">Information Entreprise</h2></div>
          <div className="card-body">
            <div className="cols-2">
              <div>
                <label>Nom de l’entreprise</label>
                <input value={entreprise.nom} onChange={e=>setField("nom",e.target.value)} placeholder="ex. BORDE TA VOILE" />
                <label>Adresse</label>
                <input value={entreprise.adresse} onChange={e=>setField("adresse",e.target.value)} placeholder="N°, Rue" />
                <label>Code postal</label>
                <input value={entreprise.codePostal} onChange={e=>setField("codePostal",e.target.value)} placeholder="ex. 29620" />
                <label>Ville</label>
                <input value={entreprise.ville} onChange={e=>setField("ville",e.target.value)} placeholder="ex. Locquirec" />

                <label className="inline-label">
                  <span>Distance (km)</span>
                  {coutAR && <span className="hint">Coût A/R : <b>{coutAR} €</b></span>}
                </label>
                <input value={entreprise.distance} onChange={e=>setField("distance",e.target.value)} placeholder="ex. 30" />

                <label>E-mail entreprise</label>
                <input value={entreprise.email} onChange={e=>setField("email",e.target.value)} placeholder="contact@entreprise.fr" />
                <label>Téléphone</label>
                <input value={entreprise.telephone} onChange={e=>setField("telephone",e.target.value)} placeholder="02 00 00 00 00" />
              </div>

              <div>
                <label>Secteur — Catégorie</label>
                <select value={entreprise.secteurCat} onChange={e=>setField("secteurCat",e.target.value)}>
                  <option value="">— Choisir —</option>
                  {Object.keys(SECTEURS).map(cat=>(<option key={cat} value={cat}>{cat}</option>))}
                </select>
                <label className="mt12">Sous-secteur</label>
                <select value={entreprise.secteurSub} onChange={e=>setField("secteurSub",e.target.value)} disabled={!entreprise.secteurCat}>
                  <option value="">— Choisir —</option>
                  {SECTEURS[entreprise.secteurCat||""]?.map(sub=>(<option key={sub} value={sub}>{sub}</option>))}
                </select>
                <label className="mt12">Secteur (résumé)</label>
                <input readOnly value={entreprise.secteur} placeholder="Catégorie > Sous-secteur" />

                <label>Nombre de salariés</label>
                <input value={entreprise.salaries} onChange={e=>setField("salaries",e.target.value)} placeholder="ex. 50" />
                <label>Taille (auto)</label>
                <input readOnly value={entreprise.taille} />
                <label>Site web</label>
                <div className="field-with-action">
                  <input value={entreprise.site} onChange={e=>setField("site",e.target.value)} placeholder="https://…" />
                  {entreprise.site?.trim() && <button className="tiny" onClick={()=>openURL(entreprise.site)}>Ouvrir</button>}
                </div>
                <label>Page Facebook</label>
                <div className="field-with-action">
                  <input value={entreprise.facebook} onChange={e=>setField("facebook",e.target.value)} placeholder="https://facebook.com/…" />
                  {entreprise.facebook?.trim() && <button className="tiny" onClick={()=>openURL(entreprise.facebook)}>Ouvrir</button>}
                </div>
                <label>Page Instagram</label>
                <div className="field-with-action">
                  <input value={entreprise.instagram} onChange={e=>setField("instagram",e.target.value)} placeholder="https://instagram.com/…" />
                  {entreprise.instagram?.trim() && <button className="tiny" onClick={()=>openURL(entreprise.instagram)}>Ouvrir</button>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

            {/* RIGHT : Suivi du démarchage */}
      <section className="right">
        <div className="card fill">
          <div className="card-header">
            <h2 className="card-title">
              Suivi du démarchage
              <span className="badge pill" style={{ marginLeft: 8 }}>
                {entreprise.statut || "En prospection"}
              </span>
            </h2>
              <div className="card-header-actions">
              <button
                  className="btn small"
                  onClick={() => setShowRdvModal(true)}
                    >
                      📅 Rendez-vous
                    </button>
              <button className="btn small" onClick={relancerAuj}>↻ Relancer aujourd’hui</button>
            </div>
          </div>

          <div className="card-body">

            {/* Résumé + progression */}
            <div className="resume-row">
              <div className="badges">
                <span className="badge pill">Relances : {resume.Relance}</span>
                <span className="badge pill">RDV : {resume.RendezVous}</span>
                <span className="badge pill">Devis : {resume.Devis}</span>
                <span className="badge pill">Événements : {resume.Evenement}</span>
              </div>
              <div className="progress-wrap" title={`Cycle : ${STAT_PROGRESS(entreprise.statut)}%`}>
                <div className="progress-bar">
                  <div
                    className={`progress-fill s-${STAT_STEPS.indexOf(entreprise.statut)}`}
                    style={{width: STAT_PROGRESS(entreprise.statut)+"%"}}
                  />
                </div>
                <div className="progress-label">{entreprise.statut}</div>
              </div>
            </div>

            {/* JOURNAL DE BORD : modèle 2 */}
                <div className="action-row">
                  <label>Journal de bord</label>

                  {/* 1) Type d’action (en premier) */}
                  <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>
                    Type d’action
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                    <button
                      type="button"
                      className={`btn small${actionCat === "Envoi" ? " cta quick-selected" : ""}`}
                      onClick={() => {
                        // On prépare une nouvelle action : type choisi, moyen remis à zéro
                        setActionCat("Envoi");
                        setActionSub("");
                      }}
                    >
                      ✉️ Envoi
                    </button>

                    <button
                      type="button"
                      className={`btn small${actionCat === "Relance" ? " cta quick-selected" : ""}`}
                      onClick={() => {
                        setActionCat("Relance");
                        setActionSub("");
                      }}
                    >
                      🔁 Relance
                    </button>

                    <button
                      type="button"
                      className={`btn small${actionCat === "Événement" ? " cta quick-selected" : ""}`}
                      onClick={() => {
                        setActionCat("Événement");
                        setActionSub("");
                      }}
                    >
                      🎪 Événement
                    </button>

                    <button
                      type="button"
                      className={`btn small${actionCat === "Autre" ? " cta quick-selected" : ""}`}
                      onClick={() => {
                        setActionCat("Autre");
                        setActionSub("");
                      }}
                    >
                      ✏️ Autre
                    </button>
                  </div>

                  {/* 2) Moyen de contact (après) */}
                  <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>
                    Moyen de contact
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {[
                      "Courrier",
                      "Mail",
                      "Téléphone",
                      "SMS",
                      "LinkedIn",
                      "Visio",
                      "Sur site",
                      "Devis"
                    ].map((chan) => {
                      const label =
                        chan === "Courrier"  ? "📨 Courrier"  :
                        chan === "Mail"      ? "✉️ Mail"      :
                        chan === "Téléphone" ? "📞 Téléphone" :
                        chan === "SMS"       ? "💬 SMS"       :
                        chan === "LinkedIn"  ? "🔗 LinkedIn"  :
                        chan === "Visio"     ? "📹 Visio"     :
                        chan === "Sur site"  ? "🏢 Sur site"  :
                        /* Devis */            "🧾 Devis";

                      return (
                        <button
                          key={chan}
                          type="button"
                          className={`btn small${actionSub === chan ? " cta quick-selected" : ""}`}
                          onClick={() => {
                            const sub = chan;
                            setActionSub(sub);

                            // si aucun type n’a été choisi, on ne crée pas l’action
                            if (!actionCat) {
                              alert("Commence par choisir un type d’action.");
                              return;
                            }

                            const low = sub.toLowerCase();
                            let note;
                            if (actionCat === "Envoi")              note = `Envoi via ${low}`;
                            else if (actionCat === "Relance")       note = `Relance ${low}`;
                            else if (actionCat === "Rendez-vous")   note = `RDV (${low})`;
                            else if (actionCat === "Événement")     note = `Événement (${low})`;
                            else                                    note = `Action autre via ${low}`;

                            // 👉 C’est ici seulement que l’action est réellement ajoutée
                            addActivity({
                              type: actionCat,
                              subType: sub,
                              result: "En cours",
                              note
                            });
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>



            {/* TIMELINE HORIZONTALE */}
            <div className={`timeline-h ${tlCondensed ? "condensed" : ""}`}>
              {filteredTimeline.length ? (
                <ul className="timeline-h-list">
                  {filteredTimeline.map(a => {
                    const rawNote   = (a.note || "").trim();
                    const noteLower = rawNote.toLowerCase();
                    const typeLower = (a.type || "").toLowerCase();
                    const subLower  = (a.subType || "").toLowerCase();

                    // On masque les notes "automatiques" (doublons d'info)
                    const isAutoNote =
                      (typeLower === "relance"     && noteLower === `relance ${subLower}`) ||
                      (typeLower === "envoi"       && noteLower === `envoi via ${subLower}`) ||
                      (typeLower === "rendez-vous" && noteLower === `rdv (${subLower})`) ||
                      (typeLower === "événement"   && noteLower === `événement (${subLower})`) ||
                      (typeLower === "autre"       && noteLower === `action autre via ${subLower}`);

                    const showNote = rawNote && !isAutoNote;

                    return (
                      <li
                        key={a.id}
                        className={
                          "timeline-card " +
                          (a.type === "Relance" ? "t-relance" :
                          a.type === "Rendez-vous" ? "t-rendez-vous" :
                          a.type === "Envoi" ? "t-envoi" :
                          a.type === "Événement" ? "t-evenement" : "t-autre")
                        }
                      >
                       <div className="tl-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div>
                          <div className="tl-type">
                            {a.type}{a.subType ? " · " + a.subType : ""}
                          </div>
                          <div className="tl-date">
                            {new Date(a.dateISO).toLocaleString("fr-FR")}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn small danger"
                          onClick={() => deleteActivity(a.id)}
                          aria-label="Supprimer l’action"
                          title="Supprimer l’action"
                          style={{ marginLeft: 8, padding: "4px 6px", lineHeight:"1" }}
                        >
                          🗑️
                        </button>
                      </div>
                        {showNote && <div className="tl-note">{a.note}</div>}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div style={{ opacity: .7 }}>Aucune action pour l’instant.</div>
              )}
            </div>


            {/* Montant potentiel seulement */}
            <div style={{marginTop:16}}>
              <label>Montant potentiel (€)</label>
              <input
                value={entreprise.montant || ""}
                onChange={e=>setField("montant", e.target.value.replace(",", "."))}
                placeholder="Montant du sponsoring"
              />
            </div>

          </div>
        </div>
      </section>

      {/* RIGHT-UNDER Contact chips */}
      <section className="right-under">
        <div className="card">
          <div className="card-header no-divider" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "nowrap" }}>
            <h2 className="card-title" style={{ marginRight: 10, flex: "0 0 auto" }}>Contacts</h2>
            <div
              className="contacts-scroll"
              style={{flex:"1 1 auto", display:"flex", alignItems:"center", gap:8, overflowX:"auto", whiteSpace:"nowrap", scrollbarWidth:"thin", padding:"2px 0"}}
              onDragOver={(e) => e.preventDefault()}
            >
              {(entreprise.contacts || []).map((c) => (
                <div key={c.id} className="contact-chip compact two-line"
                  title={`${(c.nom + " " + c.prenom).trim() || "Sans nom"}${c.fonction ? " — " + c.fonction : ""}`}
                  onClick={() => openContactModal(c)}
                  onContextMenu={(e) => { e.preventDefault(); setContextMenu({ visible: true, x: e.clientX, y: e.clientY, contact: c }); }}
                  draggable onDragStart={(e) => e.dataTransfer.setData("contactId", String(c.id))}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const fromId = Number(e.dataTransfer.getData("contactId"));
                    const toId = c.id; if (!fromId || fromId === toId) return;
                    setEntreprise(prev => {
                      const list = [...(prev.contacts || [])];
                      const from = list.findIndex(x => x.id === fromId);
                      const to = list.findIndex(x => x.id === toId);
                      if (from < 0 || to < 0) return prev;
                      const [moved] = list.splice(from, 1);
                      list.splice(to, 0, moved);
                      return { ...prev, contacts: list };
                    });
                  }}
                >
                  <span className={`status-dot ${c.statut || "actif"}`} />
                  {c.principal ? <span className="star" title="Contact principal">★</span> : null}
                  <div className="contact-lines">
                    <strong className="contact-name">
                      {(c.nom + " " + c.prenom).trim() || "Sans nom"}
                    </strong>
                    <span className="contact-sub">
                      {c.fonction || "Contact"}{c.lastISO ? ` · ↻ ${new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })
                        .format(Math.round((new Date(c.lastISO).getTime() - Date.now()) / (1000 * 60 * 60 * 24)), "day")}` : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="card-header-actions" style={{ flex: "0 0 auto" }}>
              <button className="btn small" onClick={() => openContactModal()}>Ajouter un contact</button>
            </div>
          </div>
        </div>

        {/* Menu contextuel */}
        {contextMenu?.visible && (
          <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} onMouseLeave={() => setContextMenu({ visible: false, x:0, y:0, contact:null })}>
            <button onClick={() => { navigator.clipboard.writeText(contextMenu.contact.email || ""); setContextMenu({ visible:false, x:0, y:0, contact:null }); }}>Copier l’e-mail</button>
            <button onClick={() => { navigator.clipboard.writeText(contextMenu.contact.tel || ""); setContextMenu({ visible:false, x:0, y:0, contact:null }); }}>Copier le téléphone</button>
            <button onClick={() => { setContextMenu({ visible:false, x:0, y:0, contact:null }); openContactModal(contextMenu.contact); }}>Éditer</button>
            <button onClick={() => {
              setEntreprise(prev => ({ ...prev, contacts: (prev.contacts||[]).map(x => ({ ...x, principal: x.id === contextMenu.contact.id })) }));
              setContextMenu({ visible:false, x:0, y:0, contact:null });
            }}>Définir comme ⭐ principal</button>
            <button onClick={() => {
              setEntreprise(prev => ({ ...prev, contacts: (prev.contacts||[]).map(x => x.id === contextMenu.contact.id ? { ...x, lastISO: new Date().toISOString() } : x) }));
              setContextMenu({ visible:false, x:0, y:0, contact:null });
            }}>↻ Dernier échange = aujourd’hui</button>
            <hr/>
            <button className="danger" onClick={() => {
              if (!confirm("Supprimer ce contact ?")) return;
              setEntreprise(prev => ({ ...prev, contacts: (prev.contacts||[]).filter(x => x.id !== contextMenu.contact.id) }));
              setContextMenu({ visible:false, x:0, y:0, contact:null });
            }}>Supprimer</button>
          </div>
        )}
      </section>

      {/* BOTTOM : Liste Entreprises (avec colonne Aujourd’hui) */}
      <section className="bottom">
        <div className="card">
          <div className="card-header"><h2 className="card-title">Entreprises</h2></div>
          <div className="card-body">
            {/* Filtres */}
            <div className="cols-2" style={{marginBottom:10}}>
              <div className="field-with-action">
                <select value={filterCat} onChange={e=>{ setFilterCat(e.target.value); setFilterSub(""); }}>
                  <option value="">Filtrer par catégorie d’action</option>
                  {Object.keys(ACTIONS).map(cat=>(<option key={cat} value={cat}>{cat}</option>))}
                </select>
                <select value={filterSub} onChange={e=>setFilterSub(e.target.value)} disabled={!filterCat}>
                  <option value="">Sous-action</option>
                  {ACTIONS[filterCat||""]?.map(sub=>(<option key={sub} value={sub}>{sub}</option>))}
                </select>
              </div>
              <div className="field-with-action">
                <select value={filterTaille} onChange={e=>setFilterTaille(e.target.value)}>
                  <option value="">Toutes tailles</option>
                  <option value="MIC">MIC (0–9)</option>
                  <option value="PET">PET (10–49)</option>
                  <option value="MOY">MOY (50–249)</option>
                  <option value="GDE">GDE (250+)</option>
                </select>
                <label className="square-check" title="Entre aujourd’hui et J+7">
                  <input type="checkbox" checked={filterThisWeek} onChange={e=>setFilterThisWeek(e.target.checked)} />
                  <span>À relancer cette semaine</span>
                </label>
              </div>
            </div>

            <input className="search" placeholder="Rechercher (nom, ville, secteur…)" />
            <div className="table-wrap">
              <table className="table" id="entreprisesTable">
                <thead>
                  <tr>
                    <th>ID</th><th>Nom</th><th>Ville</th><th>Secteur</th>
                    <th>Taille</th><th>Intérêt</th><th>Dernier contact</th><th>Prochaine action</th><th>Aujourd’hui</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntreprises.length ? filteredEntreprises.map(e=>(
                    <tr key={e.id}
                        onClick={()=>{ setEntreprise({...empty,...e}); }}
                        className={isOverdue(e) ? "row-overdue" : ""}
                        style={{cursor:"pointer"}}>
                      <td>{e.id}</td>
                      <td>
                        {isOverdue(e) ? <span className="status-dot injoignable" title="Relance en retard" style={{marginRight:6}}/> : <span className="status-dot actif" title="À jour" style={{marginRight:6}}/>}
                        {e.nom}
                      </td>
                      <td>{e.ville}</td><td>{e.secteur}</td>
                      <td>{e.taille}</td><td>{e.interet}</td><td>{e.dateDernier||""}</td><td>{e.dateProchaine||""}</td>
                      <td>{isDueToday(e) ? "🟡" : ""}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="9" style={{textAlign:"center",opacity:.7}}>Aucune donnée.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Modale création de rendez-vous */}
      {showRdvModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowRdvModal(false)}
        >
          <div
            className="modal solid calendar-modal"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 900, width: "95%" }}
          >
            <div className="modal-head">
              <h3>Planifier un rendez-vous</h3>
              <div className="modal-context">
                {entreprise.nom || "Aucune entreprise sélectionnée"}
              </div>
            </div>

            <div className="modal-body">
              {/* Date + heure */}
              <div className="cols-2" style={{ marginBottom: 12 }}>
                <div>
                  <label>Date du rendez-vous</label>
                  <input
                    type="date"
                    value={entreprise.rdvDate || ""}
                    onChange={e => setField("rdvDate", e.target.value)}
                  />
                </div>
                <div>
                  <label>Heure du rendez-vous</label>
                  <input
                    type="time"
                    value={entreprise.rdvHeure || ""}
                    onChange={e => setField("rdvHeure", e.target.value)}
                  />
                </div>
              </div>

              {/* Lieu du rendez-vous */}
              <label>Lieu du rendez-vous</label>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 6,
                  marginTop: 4
                }}
              >
                {/* Sur site = adresse de l’entreprise */}
                <button
                  type="button"
                  className="btn small"
                  onClick={() =>
                    setField(
                      "rdvLieu",
                      `${entreprise.adresse || ""} ${entreprise.codePostal || ""} ${entreprise.ville || ""}`.trim()
                    )
                  }
                >
                  🏢 Sur site
                </button>
                <button
                  type="button"
                  className="btn small"
                  onClick={() => setField("rdvLieu", "Au chantier")}
                >
                  🛠️ Au chantier
                </button>
                <button
                  type="button"
                  className="btn small"
                  onClick={() => setField("rdvLieu", "")}
                >
                  📍 Autre lieu de rendez-vous
                </button>
              </div>

              <input
                value={entreprise.rdvLieu || ""}
                onChange={e => setField("rdvLieu", e.target.value)}
                placeholder="Adresse précise, visio, lieu de rencontre…"
              />

              {/* Agenda Google visible dans la fenêtre */}
              <div style={{ marginTop: 12 }}>
                <iframe
                  src={miniAgendaUrl || G_CAL_EMBED_BASE}
                  style={{ border: 0, width: "100%", borderRadius: 12 }}
                  height="400"
                  frameBorder="0"
                  scrolling="no"
                  loading="lazy"
                  title="Agenda Borde Ta Voile"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn"
                onClick={() => setShowRdvModal(false)}
              >
                Annuler
              </button>
              <button
                className="btn cta"
                onClick={() => {
                  openGCalRdv();      // ouvre Google Agenda + ajoute l’action
                  setShowRdvModal(false);
                }}
              >
                Créer dans Google Agenda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barre d’action */}
      <div className="fixed-actionbar">
        <button className="btn" onClick={exportCSV}>⬇️ Exporter CSV</button>
        <button className="btn" onClick={handleSave}>💾 Ajouter / Mettre à jour</button>
        <button className="btn" onClick={handleNew}>🆕 Nouveau</button>
        <button className="btn danger" onClick={handleDelete}>🗑️ Supprimer</button>
      </div>

      {/* Modale Contact */}
      {showContactModal && (
        <div className="modal-backdrop" onClick={closeContactModal}>
          <div className="modal solid" onClick={(e)=>e.stopPropagation()} onKeyDown={(e)=>{ if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); saveContact(); } }}>
            <div className="modal-head">
              <h3>{contactDraft.id ? `Modifier le contact — ${(contactDraft.nom+" "+contactDraft.prenom).trim()||"Sans nom"}` : "Ajouter un contact"}</h3>
              <div className="modal-context">Entreprise : <strong>{entreprise.nom || "—"}</strong></div>
            </div>
            <div className="modal-grid">
              <div>
                <label>Nom</label>
                <input tabIndex={1} value={contactDraft.nom} onChange={e=>setContactDraft({...contactDraft,nom:e.target.value})} />
                <label className="mt12">Prénom</label>
                <input tabIndex={3} value={contactDraft.prenom} onChange={e=>setContactDraft({...contactDraft,prenom:e.target.value})} />
                <label className="mt12">Fonction</label>
                <input tabIndex={5} value={contactDraft.fonction} onChange={e=>setContactDraft({...contactDraft,fonction:e.target.value})} />
                <label className="mt12">Statut <span className={`status-dot ${contactDraft.statut||"actif"}`} style={{marginLeft:6}}/></label>
                <select tabIndex={7} value={contactDraft.statut} onChange={e=>setContactDraft({...contactDraft,statut:e.target.value})}>
                  <option value="actif">Actif</option><option value="arappel">À rappeler</option><option value="injoignable">Injoignable</option>
                </select>
              </div>
              <div>
                <label>📞 Téléphone</label>
                <input tabIndex={2} className={contactDraft.tel ? (isPhone(contactDraft.tel) ? "is-valid" : "is-invalid") : ""}
                  value={contactDraft.tel} onChange={e=>setContactDraft({...contactDraft,tel:e.target.value})} />
                <label className="mt12">✉️ E-mail</label>
                <input tabIndex={4} className={contactDraft.email ? (isEmail(contactDraft.email) ? "is-valid" : "is-invalid") : ""}
                  value={contactDraft.email} onChange={e=>setContactDraft({...contactDraft,email:e.target.value})} />
                <label className="mt12">in LinkedIn</label>
                <input tabIndex={6} value={contactDraft.linkedin}
                  onBlur={(e)=>setContactDraft({...contactDraft,linkedin: cleanLinkedIn(e.target.value)})}
                  onChange={e=>setContactDraft({...contactDraft,linkedin:e.target.value})} />
                <label className="mt12">Dernier échange</label>
                <div className="field-with-action">
                  <input tabIndex={8} type="date" value={contactDraft.lastISO ? contactDraft.lastISO.slice(0,10) : ""}
                    onChange={e=>setContactDraft({...contactDraft,lastISO:e.target.value ? (new Date(e.target.value+"T00:00:00Z")).toISOString() : ""})} />
                  <button className="tiny" tabIndex={9} onClick={()=>setContactDraft({...contactDraft,lastISO:new Date().toISOString()})}>Aujourd’hui</button>
                </div>
              </div>
            </div>
            <div className="modal-row mt8">
              <label className="square-check">
                <input type="checkbox" checked={!!contactDraft.principal} onChange={e=>setContactDraft({...contactDraft,principal:e.target.checked})} />
                <span>Contact principal</span>
              </label>
            </div>
            <label className="mt12">Commentaire</label>
            <textarea className="textarea-lg comment-field" placeholder="Note interne sur ce contact…" value={contactDraft.note||""} onChange={e=>setContactDraft({...contactDraft,note:e.target.value})} />
            <div className="modal-actions centered">
              <button className="btn" onClick={closeContactModal}>Annuler</button>
              <button className="btn cta" onClick={saveContact}>{contactDraft.id ? "Mettre à jour" : "Enregistrer"}</button>
            </div>
          </div>
          {toast && <div className="toast">{toast}</div>}
        </div>
      )}

      {/* Modale Doublon */}
      {showDupModal && (
        <div className="modal-backdrop" onClick={()=>setShowDupModal(false)}>
          <div className="modal" onClick={(e)=>e.stopPropagation()}>
            <h3>Doublon détecté</h3>
            {dupCandidate ? (<p style={{marginTop:0}}>Une entreprise similaire existe déjà : <b>{dupCandidate.nom}</b>{dupCandidate.ville?` — ${dupCandidate.ville}`:""}.</p>) : <p>Une entreprise similaire existe déjà.</p>}
            <ul style={{marginTop:0}}>
              <li><b>Rafraîchir la saisie</b> : charger la fiche existante pour éviter le doublon.</li>
              <li><b>Continuer</b> : créer/mettre à jour quand même.</li>
            </ul>
            <div className="inline" style={{justifyContent:"flex-end",marginTop:10}}>
              <button className="btn" onClick={handleDupRefresh}>Rafraîchir la saisie</button>
              <button className="btn" onClick={handleDupContinue} title="Entrée = Continuer">Continuer</button>
            </div>
            <div style={{opacity:.7,fontSize:12,marginTop:6}}>Astuce : appuie sur <b>Entrée</b> pour Continuer.</div>
          </div>
        </div>
      )}
      {/* Modale Agenda RDV (Google Agenda) */}
      {showRdvCalendar && (
        <div className="modal-backdrop" onClick={() => setShowRdvCalendar(false)}>
          <div className="modal solid calendar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Google Agenda — bordetavoile@gmail.com</h3>
              {entreprise.rdvDate && (
                <div className="modal-context">
                  Autour du{" "}
                  {new Date(entreprise.rdvDate + "T00:00:00").toLocaleDateString("fr-FR")}
                </div>
              )}
            </div>

            <iframe
              src={
                miniAgendaUrl ||
                "https://calendar.google.com/calendar/embed?src=bordetavoile%40gmail.com&ctz=Europe%2FParis"
              }
              style={{ border: 0, width: "100%", borderRadius: 12 }}
              height="600"
              frameBorder="0"
              scrolling="no"
              loading="lazy"
              title="Agenda Borde Ta Voile"
            />

            <div className="modal-actions centered">
              <button className="btn" onClick={() => setShowRdvCalendar(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Calendrier */}
      {showCalendar && (
        <div className="modal-backdrop" onClick={()=>setShowCalendar(false)}>
          <div className="modal solid calendar-modal" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-head">
              <h3>Calendrier des relances — {cal.label}</h3>
              <div className="modal-context">Clique un jour pour voir les relances</div>
            </div>
            <div className="calendar-controls">
              <button className="btn small" onClick={()=>setCalendarMonthOffset(calendarMonthOffset-1)}>◀</button>
              <button className="btn small" onClick={()=>setCalendarMonthOffset(0)}>Aujourd’hui</button>
              <button className="btn small" onClick={()=>setCalendarMonthOffset(calendarMonthOffset+1)}>▶</button>
            </div>
            <div className="calendar-grid">
              {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(d=>(<div key={d} className="cal-head">{d}</div>))}
              {Array.from({length: cal.startDay}).map((_,i)=>(<div key={"pad"+i} className="cal-cell pad"></div>))}
              {Array.from({length: cal.daysInMonth}).map((_,i)=>{
                const d = String(i+1).padStart(2,"0");
                const key = `${cal.year}-${String(cal.month+1).padStart(2,"0")}-${d}`;
                const items = eventsByDate[key]||[];
                return (
                  <div key={key} className={`cal-cell ${key===todayISO()?"today":""}`}>
                    <div className="cal-daynum">{i+1}</div>
                    <div className="cal-items">
                      {items.map(ev=>(<div key={ev.id} className="cal-item" title={ev.action}>{ev.nom}</div>))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="modal-actions centered">
              <button className="btn" onClick={()=>setShowCalendar(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast global */}
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
