// ===== BTV Renderer (full) =====

// ---------- Utils de base ----------
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function loadBtv() {
  try { return JSON.parse(localStorage.getItem("btv_liste") || "[]"); } catch { return []; }
}
function saveBtv(arr) {
  try { localStorage.setItem("btv_liste", JSON.stringify(arr || [])); } catch {}
}
function getAllSafe() {
  try { if (typeof getAll === "function") return getAll(); } catch {}
  return loadBtv();
}
function countRelancesDue(arr) {
  const today = todayISO();
  return (arr || []).filter(e => (e?.dateProchaine || "") && e.dateProchaine <= today).length;
}

// ---------- Copie presse-papiers avec fallback ----------
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext !== false) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// ---------- Indicateurs header ----------
function refreshIndicators() {
  const arr = getAllSafe();
  const indDate = document.getElementById("indDate");
  const indCount = document.getElementById("indCount");
  const indRelances = document.getElementById("indRelances");
  const indSaved = document.getElementById("indSaved");

  if (indDate) {
    const now = new Date();
    const dateStr = now.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "short", year: "numeric" });
    const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    indDate.textContent = `${dateStr} — ${timeStr}`;
  }
  if (indCount) {
    const n = Array.isArray(arr) ? arr.length : 0;
    indCount.textContent = `${n} entreprise${n > 1 ? "s" : ""}`;
  }
  if (indRelances) {
    indRelances.textContent = `🔔 ${countRelancesDue(arr)}`;
  }
  if (indSaved) {
    indSaved.classList.remove("is-dirty");
    indSaved.textContent = "☁️ Sauvegardé";
  }
}
window.addEventListener("btv:entreprisesChanged", refreshIndicators);
window.addEventListener("btv:saved", refreshIndicators);
window.addEventListener("btv:dirty", () => {
  const indSaved = document.getElementById("indSaved");
  if (indSaved) { indSaved.classList.add("is-dirty"); indSaved.textContent = "✎ Modifs en cours"; }
});
setInterval(() => {
  const indDate = document.getElementById("indDate");
  if (!indDate) return;
  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  indDate.textContent = `${dateStr} — ${timeStr}`;
}, 60_000);

// ---------- Dropdown “Données” (ouverture/fermeture) ----------
(function initDropdown() {
  const container = document.getElementById("menuData");
  const btn = document.getElementById("btnMenuData");
  const panel = container?.querySelector(".dropdown-panel");
  if (!container || !btn || !panel) return;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    container.classList.toggle("open");
  });
  document.addEventListener("click", () => container.classList.remove("open"));
  panel.addEventListener("click", (e) => e.stopPropagation());
})();

// ---------- Constantes CSV ----------
const SEP = ";";
const CSV_HEADERS = [
  "id","nom","adresse","codePostal","ville","distance",
  "email","telephone",
  "secteur","secteurCat","secteurSub","salaries","taille",
  "site","facebook","instagram",
  "interet","dateDernier","dateProchaine",
  "prochaineAction","prochaineActionCat","prochaineActionSub",
  "montant","statut",
  "contact_nom","contact_prenom","contact_fonction",
  "contact_tel","contact_email","contact_linkedin",
  "contact_statut","contact_principal","contact_lastISO","contact_note"
];

// ---------- Télécharger le modèle CSV (monocolonne via formule ="...") ----------
(function initCsvModelButton() {
  const btn = document.getElementById("btnCSVModel");
  if (!btn) return;

  const HEADERS = Array.isArray(CSV_HEADERS) ? CSV_HEADERS : [];
  const asFormula = (s) => `="${String(s).replace(/"/g, '""')}"`; // ligne entière comme formule

  btn.addEventListener("click", () => {
    const header = HEADERS.join(SEP);
    const example = new Array(HEADERS.length).fill("").join(SEP);
    const mono = [asFormula(header), asFormula(example)].join("\n");
    const file = "\uFEFF" + mono; // BOM pour Excel/Windows
    const blob = new Blob([file], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "modele_entreprises_btv.csv";
    document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },0);
  });
})();

// ---------- Exporter CSV (monocolonne via formule ="...") ----------
(function initExport(){
  const btn = document.getElementById("btnExport");
  if(!btn) return;

  const HEADERS = Array.isArray(CSV_HEADERS) ? CSV_HEADERS : [];
  const asFormula = (s) => `="${String(s).replace(/"/g, '""')}"`;

  function objToCsvRow(e){
    return HEADERS.map(h=>{
      let v = e[h];
      if(v==null && h==="secteurCat" && e.secteur) v = String(e.secteur).split(" > ")[0]||"";
      if(v==null && h==="secteurSub" && e.secteur) v = String(e.secteur).split(" > ")[1]||"";
      return v==null ? "" : String(v).replace(/\r|\n/g, " ");
    }).join(SEP);
  }

  btn.addEventListener("click", ()=>{
    const data = (typeof getAllSafe === "function") ? getAllSafe() : [];
    const header = HEADERS.join(SEP);
    const rows = (data||[]).map(objToCsvRow);
    const mono = [asFormula(header), ...rows.map(asFormula)].join("\n");
    const file = "\uFEFF" + mono; // BOM pour Excel
    const blob = new Blob([file], {type:"text/csv;charset=utf-8"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "entreprises_export.csv";
    document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },0);
  });
})();

// ---------- Importer CSV : monocolonne (apostrophe / guillemets / formule) OU CSV classique ----------
(function initImport(){
  const btn = document.getElementById("btnImport");
  if(!btn) return;

  // Parseur simple ; avec guillemets cellule
  function parseCSV(text){
    const lines = String(text||"").replace(/\r/g,"").split("\n").filter(l=>l.trim().length);
    if(!lines.length) return {headers:[], rows:[]};
    const parseLine = (line)=>{
      const out=[]; let cur=""; let q=false;
      for(let i=0;i<line.length;i++){
        const ch=line[i];
        if(q){
          if(ch=='"' && line[i+1]=='"'){ cur+='"'; i++; }
          else if(ch=='"'){ q=false; }
          else{ cur+=ch; }
        }else{
          if(ch=='"'){ q=true; }
          else if(ch==SEP){ out.push(cur); cur=""; }
          else{ cur+=ch; }
        }
      }
      out.push(cur);
      return out;
    };
    const headers = parseLine(lines[0]).map(h=>h.trim());
    const rows = lines.slice(1).map(l=>parseLine(l));
    return { headers, rows };
  }

  // Normalise monocolonne : apostrophe, ligne entière entre guillemets, ou formule ="..."
  function normalizeMonocolonne(raw){
    let txt = String(raw || "").replace(/^\uFEFF/, "").replace(/\r/g,'');
    const lines = txt.split("\n");

    // Cas 1 : apostrophe au début des lignes
    const startsWithApo = lines.filter(l => l.trim().startsWith("'")).length >= Math.max(1, Math.floor(lines.length*0.6));
    if (startsWithApo) {
      return lines.map(l => l.replace(/^(\s*)'/, "$1")).join("\n");
    }

    // Cas 2 : monocolonne entre guillemets (toute la ligne est une seule cellule)
    const first = lines[0] || "";
    const isQuotedWholeLine =
      /^"\s*.*\s*"$/.test(first) && !first.slice(1, -1).includes('","');
    if (isQuotedWholeLine) {
      const unquote = (s) => {
        if (s.startsWith(`"`) && s.endsWith(`"`)) s = s.slice(1, -1);
        return s.replace(/""/g, `"`); // dés-échappe
      };
      return lines.map(unquote).join("\n");
    }

    // Cas 3 : chaque ligne est une formule ="..."
    const isFormulaWholeLine = /^=\s*".*"\s*$/.test(first);
    if (isFormulaWholeLine) {
      const stripFormula = (s) => {
        const m = s.match(/^=\s*"(.*)"\s*$/);
        const inner = m ? m[1] : s;
        return String(inner).replace(/""/g, `"`);
      };
      return lines.map(stripFormula).join("\n");
    }

    // Sinon, CSV déjà classique
    return txt;
  }

  // En-tête attendu = constante locale
  async function loadExpectedHeaders(){
    return Array.isArray(CSV_HEADERS) ? CSV_HEADERS : [];
  }

  btn.addEventListener("click", async ()=>{
    const expectedHeaders = await loadExpectedHeaders();
    if (!expectedHeaders.length) return alert("Modèle CSV introuvable (en-tête).");

    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = ".csv,text/csv";
    inp.onchange = async (e)=>{
      const file = e.target.files?.[0]; if(!file) return;
      let text = await file.text();
      text = text.replace(/^\uFEFF/, "");       // enlève BOM
      text = normalizeMonocolonne(text);        // monocolonne -> CSV texte au ;

      const { headers, rows } = parseCSV(text);

      // Validation stricte : en-tête identique au modèle
      if (headers.join(SEP) !== expectedHeaders.join(SEP)) {
        return alert("Format invalide : l'en-tête CSV ne correspond pas au modèle officiel.\n\nAttendu :\n" + expectedHeaders.join(SEP) + "\n\nReçu :\n" + headers.join(SEP));
      }

      // Map -> objets
      const list = rows.map(cols=>{
        const obj = {};
        expectedHeaders.forEach((h,i)=> obj[h] = cols[i] ?? "");
        return obj;
      }).filter(o => (o.nom||"").trim());

      // Normalisation minimale (ID + champ secteur dérivé)
      let arr = (typeof getAllSafe === "function") ? getAllSafe() : [];
      const existingIds = new Set(arr.map(e=>Number(e.id)).filter(Number.isFinite));
      let nextId = 1; while(existingIds.has(nextId)) nextId++;
      const normalize = (e)=>{
        const n = {...e};
        n.id = Number(n.id)|| (nextId++);
        if(n.secteurCat || n.secteurSub) n.secteur = [n.secteurCat||"", n.secteurSub||""].filter(Boolean).join(" > ");
        if(n.salaries && !n.taille){
          const s = Number(n.salaries)||0;
          n.taille = s<=9?"MIC":s<=49?"PET":s<=249?"MOY":"GDE";
        }
        return n;
      };
      const merged = [...arr, ...list.map(normalize)];
      try { localStorage.setItem("btv_liste", JSON.stringify(merged)); } catch {}
      try{
        window.dispatchEvent(new CustomEvent('btv:entreprisesChanged'));
        window.dispatchEvent(new CustomEvent('btv:saved'));
      }catch{}
      alert(`Import terminé : ${list.length} ligne(s).`);
    };
    inp.click();
  });
})();

// ---------- Vider la base ----------
// ---------- Fusionner les doublons ----------
(function initMergeDuplicatesButton() {
  const btn = document.getElementById("btnMergeDup");
  if (!btn) return;

  const norm = (s) => (s || "").toString().trim().toLowerCase();
  const cleanPhone = (s) => String(s || "").replace(/\D/g, "");

  btn.addEventListener("click", () => {
    const arr = getAllSafe();
    if (!arr.length) {
      alert("Aucune entreprise dans la base.");
      return;
    }

    if (!confirm("Fusionner les doublons possibles (nom/ville, e-mail ou site) ?")) {
      return;
    }

    let uniqSeq = 0;
    const buildKey = (e) => {
      const email = norm(e.email);
      const site  = norm(e.site);
      const nom   = norm(e.nom);
      const ville = norm(e.ville);

      if (email) return "m:" + email;
      if (site)  return "s:" + site;
      if (nom || ville) return "nv:" + nom + "|" + ville;
      return ""; // pas exploitable
    };

    const map = new Map();

    for (const e of arr) {
      let key = buildKey(e);
      if (!key) key = "u:" + (uniqSeq++); // garde les lignes « bizarres » telles quelles

      const existing = map.get(key);
      if (!existing) {
        map.set(key, { ...e });
        continue;
      }

      const target = existing;
      const source = e;

      // 1) Compléter les champs vides avec les infos de l'autre fiche
      const fields = new Set([...Object.keys(target), ...Object.keys(source)]);
      fields.forEach((f) => {
        const v1 = target[f];
        const v2 = source[f];
        const isEmpty = (v) => v === undefined || v === null || v === "";
        if (isEmpty(v1) && !isEmpty(v2)) {
          target[f] = v2;
        }
      });

      // 2) Fusion des contacts (sans doublons mail/téléphone)
      const contactsA = Array.isArray(target.contacts) ? target.contacts : [];
      const contactsB = Array.isArray(source.contacts) ? source.contacts : [];
      const mergedContacts = [...contactsA];

      for (const c of contactsB) {
        const mail = norm(c.email);
        const tel  = cleanPhone(c.tel);
        const exists = mergedContacts.some((x) =>
          (mail && norm(x.email) === mail) ||
          (tel && cleanPhone(x.tel) === tel)
        );
        if (!exists) mergedContacts.push(c);
      }
      if (mergedContacts.length) {
        target.contacts = mergedContacts;
      }

      // 3) Fusion des activités (on concatène)
      const actsA = Array.isArray(target.activities) ? target.activities : [];
      const actsB = Array.isArray(source.activities) ? source.activities : [];
      if (actsA.length || actsB.length) {
        target.activities = [...actsA, ...actsB];
      }

      // 4) Garde le plus petit id pour la stabilité
      const id1 = Number(target.id);
      const id2 = Number(source.id);
      if (Number.isFinite(id1) && Number.isFinite(id2) && id2 < id1) {
        target.id = id2;
      }

      map.set(key, target);
    }

    const merged = Array.from(map.values());
    if (merged.length === arr.length) {
      alert("Aucun doublon évident détecté (rien n’a été modifié).");
      return;
    }

    // Re-numérotation propre des IDs à partir de 1
    merged.sort((a, b) => {
      const n = norm(a.nom).localeCompare(norm(b.nom));
      if (n !== 0) return n;
      return norm(a.ville).localeCompare(norm(b.ville));
    });
    merged.forEach((e, idx) => { e.id = idx + 1; });

    saveBtv(merged);
    refreshIndicators();
    try {
      window.dispatchEvent(new CustomEvent("btv:entreprisesChanged"));
      window.dispatchEvent(new CustomEvent("btv:saved"));
    } catch {}

    const removed = arr.length - merged.length;
    alert(`Fusion terminée : ${removed} fiche(s) doublon fusionnée(s).`);
  });
})();

(function initClearAllButton() {
  const btn = document.getElementById("btnClearAll");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (!confirm('Vider toutes les entreprises enregistrées ?')) return;
    localStorage.removeItem("btv_liste");
    localStorage.removeItem("btv_last_action");
    refreshIndicators();
    try {
      window.dispatchEvent(new CustomEvent("btv:entreprisesChanged"));
      window.dispatchEvent(new CustomEvent("btv:saved"));
    } catch {}
    alert("Base vidée.");
  });
})();

// ---------- (Optionnel) Recherche nouvelle entreprise : laissé tel quel si le bouton existe ----------
(function initSearchNew() {
  const btnSearchNew = document.getElementById("btnSearchNew");
  if (!btnSearchNew) return; // si le bouton n'existe pas, on n'active rien

  // Branche ici ton comportement si besoin.
})();

// ---------- Démarrage ----------
document.addEventListener("DOMContentLoaded", () => {
  try {
    refreshIndicators();
    const bootlog = document.getElementById("bootlog");
    if (bootlog) bootlog.style.display = "none";
    window.dispatchEvent(new CustomEvent("btv:ui-mounted"));
  } catch (e) {
    console.error(e);
  }
});
