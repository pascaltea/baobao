// Audit de contraste (WCAG) : pour chaque texte visible, compare sa couleur
// au fond réel (premier ancêtre au fond opaque) et signale les ratios trop faibles.
import { chromium } from 'playwright';
const base = process.argv[2] || 'http://localhost:8000/';
const SCENARIOS = [
  { nom: 'clair', schema: 'light', sombre: 'non', mode: 'adulte' },
  { nom: 'sombre', schema: 'dark', sombre: 'auto', mode: 'adulte' },
  { nom: 'enfant', schema: 'light', sombre: 'auto', mode: 'enfant' },
];
const mesurer = () => {
  const rgb = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r,g,b,a=1] = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return {r,g,b,a}; };
  const lum = ({r,g,b}) => { const f = (v) => { v/=255; return v<=0.03928 ? v/12.92 : ((v+0.055)/1.055)**2.4; }; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
  const melange = (h, b) => ({ r: h.r*h.a + b.r*(1-h.a), g: h.g*h.a + b.g*(1-h.a), b: h.b*h.a + b.b*(1-h.a), a: 1 });
  const fondDe = (el) => {
    const couches = [];
    for (let e = el; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { couches.push(c); if (c.a >= 0.95) break; } }
    let fond = rgb(getComputedStyle(document.body).backgroundColor) || {r:255,g:255,b:255,a:1};
    for (const c of couches.reverse()) fond = melange(c, fond);
    return fond;
  };
  const resultats = [];
  const marcheur = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const vus = new Set();
  while (marcheur.nextNode()) {
    const t = marcheur.currentNode; const el = t.parentElement;
    if (!el || vus.has(el) || !t.textContent.trim()) continue;
    if (/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+$/u.test(t.textContent.trim())) continue;
    vus.add(el);
    const st = getComputedStyle(el); const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || st.visibility === 'hidden' || el.closest('.cache, [hidden], rt, svg')) continue;
    if (parseFloat(st.opacity) < 0.5) continue;
    let couleur = rgb(st.color); if (!couleur) continue;
    const fond = fondDe(el); couleur = melange(couleur, fond);
    const L1 = lum(couleur), L2 = lum(fond); const ratio = (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
    const taille = parseFloat(st.fontSize), gras = parseInt(st.fontWeight) >= 700;
    const seuil = (taille >= 24 || (taille >= 18.66 && gras)) ? 3 : 4.5;
    if (ratio < seuil) resultats.push({ texte: t.textContent.trim().slice(0, 40), sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '') + (el.id ? '#' + el.id : ''), ratio: ratio.toFixed(2), seuil });
  }
  // Champs de saisie : texte tapé et texte d'aide
  for (const inp of document.querySelectorAll('input:not([type=radio]):not([type=checkbox]):not([type=file]), select')) {
    const r = inp.getBoundingClientRect(); if (!r.width || inp.closest('.cache')) continue;
    const st = getComputedStyle(inp); const fond = fondDe(inp); const c = melange(rgb(st.color), fond);
    const L1 = lum(c), L2 = lum(fond); const ratio = (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
    if (ratio < 4.5) resultats.push({ texte: '[champ] ' + (inp.placeholder || inp.id), sel: inp.tagName.toLowerCase() + '#' + inp.id, ratio: ratio.toFixed(2), seuil: 4.5 });
  }
  return resultats;
};
const b = await chromium.launch();
let total = 0;
for (const sc of SCENARIOS) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: sc.schema });
  const p = await ctx.newPage();
  await p.goto(base);
  await p.evaluate(([sombre, mode]) => {
    localStorage.clear();
    localStorage.setItem('mandarin-famille-sombre', sombre);
    localStorage.setItem('mandarin-famille-bienvenue', '1');
    localStorage.setItem('mandarin-famille-astuce-glisser', '1');
    localStorage.setItem('mandarin-famille', JSON.stringify({ profils: [{ id: 'a', nom: 'Papa', avatar: '🙂', mode, mots: { baba: { niveau: 1, prochaine: '2000-01-01', debut: '2099-01-01' } }, lecons: [] }], actif: 'a' }));
  }, [sc.sombre, sc.mode]);
  const etats = [];
  const verifier = async (nom) => { const r = await p.evaluate(mesurer); if (r.length) etats.push([nom, r]); total += r.length; };
  await p.goto(base + 'index.html#apprendre'); await p.reload(); await p.waitForTimeout(600); await verifier('accueil/apprendre');
  for (const o of ['famille', 'succes', 'profil']) { await p.click('.onglet[data-cible=' + o + ']'); await p.waitForTimeout(350); await verifier('accueil/' + o); }
  await p.click('#b-changer'); await p.waitForTimeout(300); await verifier('profils');
  await p.focus('#nom'); await p.fill('#nom', 'Pascal'); await verifier('profils (saisie)');
  await p.goto(base + 'pages/lecon.html?cle=famille:0'); await p.waitForTimeout(600); await verifier('leçon/découverte');
  for (let i = 0; i < 6; i++) { if (await p.locator('.choix button').count()) break; await p.click('#continuer'); await p.waitForTimeout(300); }
  await verifier('leçon/exercice');
  if (await p.locator('.choix button').count()) { await p.locator('.choix button').first().click(); await p.waitForTimeout(300); await verifier('leçon/correction'); }
  for (const [pg, attente] of [['quotidien.html#repas', 600], ['comptines.html#laohu', 600], ['histoires.html#pluie', 600], ['lexique.html', 600], ['imagier.html', 400], ['tons.html', 600], ['quiz.html', 600], ['flashcards.html', 600]]) {
    await p.goto(base + 'pages/' + pg); await p.waitForTimeout(attente); await verifier(pg);
  }
  console.log('\n=== ' + sc.nom + ' ===');
  for (const [nom, r] of etats) {
    console.log('  ' + nom + ' :');
    const groupes = new Map(); for (const x of r) { const k = x.sel; if (!groupes.has(k)) groupes.set(k, x); }
    for (const x of groupes.values()) console.log('     ' + x.ratio + ' < ' + x.seuil + '  ' + x.sel + '  « ' + x.texte + ' »');
  }
  await ctx.close();
}
console.log('\nTOTAL problèmes:', total);
await b.close();
