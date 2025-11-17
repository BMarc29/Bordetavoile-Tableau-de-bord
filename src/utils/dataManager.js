// src/utils/dataManager.js — import/export robustes (FR-friendly)
(() => {
  const HEADERS = [
    "id","nom","adresse","codePostal","ville","distance",
    "email","telephone",
    "secteur","secteurCat","secteurSub","salaries","taille",
    "site","facebook","instagram",
    "interet","dateDernier","dateProchaine",
    "prochaineAction","prochaineActionCat","prochaineActionSub",
    "montant","statut"
  ];

  // --- Détecte séparateur sur la 1re ligne
  const detectSep = (line) => (line.split(';').length > line.split(',').length ? ';' : ',');

  // --- Parse une ligne CSV en tenant compte des guillemets
  const parseLine = (line, SEP) => {
    const out = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQ) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') { inQ = false; }
        else { cur += c; }
      } else {
        if (c === '"') inQ = true;
        else if (c === SEP) { out.push(cur); cur = ""; }
        else { cur += c; }
      }
    }
    out.push(cur);
    return out;
  };

  // --- Échappement CSV
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

  const dm = {};

  // ===== IMPORT =====
  dm.importCSV = async (fileOrText) => {
    const text = typeof fileOrText === "string" ? fileOrText : await fileOrText.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim().length);
    if (!lines.length) return [];

    const SEP = detectSep(lines[0]);
    const headers = parseLine(lines[0], SEP).map(h => h.trim());
    const idx = (h) => headers.indexOf(h);

    const out = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = parseLine(lines[i], SEP);
      const get = (h) => { const j = idx(h); return j >= 0 ? cells[j] ?? "" : ""; };
      out.push({
        id: Number(get("id")) || null,
        nom: get("nom"),
        adresse: get("adresse"),
        codePostal: get("codePostal"),
        ville: get("ville"),
        distance: get("distance"),
        email: get("email"),
        telephone: get("telephone"),
        secteur: get("secteur"),
        secteurCat: get("secteurCat"),
        secteurSub: get("secteurSub"),
        salaries: get("salaries"),
        taille: get("taille"),
        site: get("site"),
        facebook: get("facebook"),
        instagram: get("instagram"),
        interet: get("interet") || "3",
        dateDernier: get("dateDernier"),
        dateProchaine: get("dateProchaine"),
        prochaineAction: get("prochaineAction"),
        prochaineActionCat: get("prochaineActionCat"),
        prochaineActionSub: get("prochaineActionSub"),
        montant: get("montant"),
        statut: get("statut") || "En prospection",
        contacts: [],
        activities: []
      });
    }
    return out;
  };

  // ===== EXPORT =====
  dm.exportCSV = (entreprises = []) => {
    const SEP = ';'; // FR/Excel friendly
    const lines = [];

    // Indication Excel FR + BOM gérés au niveau Blob
    lines.push("sep=" + SEP);
    lines.push(HEADERS.join(SEP));

    for (const e of entreprises) {
      const row = HEADERS.map(h => esc(e?.[h]));
      lines.push(row.join(SEP));
    }
    // \r\n pour Excel
    return lines.join("\r\n");
  };

  window.dataManager = dm;
})();

