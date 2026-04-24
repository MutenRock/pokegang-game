/* Modal helper functions extracted from app.js
 *
 * This module defines generic helpers for confirm and info modals used
 * throughout the application.  `showConfirm` displays a confirmation dialog
 * with customizable labels and callbacks.  `showInfoModal` populates and
 * shows an informational modal based on a tab identifier.  Both functions
 * are exported to the global scope.
 */
(() => {
  // Alias global sound effects engine.
  const SFX = globalThis.SFX;

  /**
   * Affiche une boîte de dialogue de confirmation.
   *
   * @param {string} message   Message HTML à afficher.
   * @param {function} onConfirm  Callback exécuté si l'utilisateur confirme.
   * @param {function|null} onCancel Callback exécuté si l'utilisateur annule.
   * @param {object} opts Options facultatives : { danger, confirmLabel, cancelLabel, lang }.
   */
  function showConfirm(message, onConfirm, onCancel = null, opts = {}) {
    const existing = document.getElementById('confirmModal');
    if (existing) existing.remove();
    if (SFX?.play) SFX.play('menuOpen');

    const modal = document.createElement('div');
    modal.id = 'confirmModal';
    modal.style.cssText =
      'position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;';

    const danger = opts.danger ? 'var(--red)' : 'var(--gold-dim)';
    const confirmLabel =
      opts.confirmLabel || (opts.lang === 'fr' ? 'Confirmer' : 'Confirm');
    const cancelLabel =
      opts.cancelLabel || (opts.lang === 'fr' ? 'Annuler' : 'Cancel');

    modal.innerHTML = `
      <div style="background:var(--bg-panel);border:2px solid ${danger};border-radius:var(--radius);padding:24px 28px;max-width:440px;width:90%;display:flex;flex-direction:column;gap:16px">
        <div style="font-size:13px;color:var(--text);line-height:1.6">${message}</div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button id="confirmModalCancel" style="font-family:var(--font-pixel);font-size:9px;padding:8px 16px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-dim);cursor:pointer">${cancelLabel}</button>
          <button id="confirmModalOk" style="font-family:var(--font-pixel);font-size:9px;padding:8px 16px;background:${opts.danger ? 'var(--red-dark)' : 'var(--bg)'};border:1px solid ${danger};border-radius:var(--radius-sm);color:${opts.danger ? '#fff' : 'var(--gold)'};cursor:pointer">${confirmLabel}</button>
        </div>
      </div>`;

    document.body.appendChild(modal);

    document.getElementById('confirmModalOk').addEventListener('click', () => {
      if (SFX?.play) SFX.play('menuClose');
      modal.remove();
      onConfirm?.();
    });
    document.getElementById('confirmModalCancel').addEventListener('click', () => {
      if (SFX?.play) SFX.play('menuClose');
      modal.remove();
      onCancel?.();
    });
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        if (SFX?.play) SFX.play('menuClose');
        modal.remove();
        onCancel?.();
      }
    });
  }

  /**
   * Ouvre le modal d'information et l'alimente selon l'onglet fourni.
   *
   * @param {string} tabId  Identifiant de l'onglet (ex : 'tabGang').
   */
  function showInfoModal(tabId) {
    const INFO = {
      tabGang: {
        title: '💀 LE GANG',
        body: `
          <strong>Réputation</strong> — Débloque zones, quêtes et achats. Visible dans la barre en haut à droite.<br><br>
          <strong>Argent (₽)</strong> — Les récompenses de combat s'accumulent dans les zones. Récupère-les via le bouton ₽ jaune (un combat est nécessaire).<br><br>
          <strong>Boss</strong> — Ton avatar. Assigne jusqu'à <strong>3 Pokémon</strong> à son équipe depuis le PC.<br><br>
          <strong>Sac</strong> — Clique sur une Ball pour l'activer. Clique sur un boost pour le lancer. L'incubateur ouvre la gestion des œufs.<br><br>
          <span class="dim">Conseil : assigne tes meilleurs Pokémon au Boss pour maximiser tes chances en combat.</span>
        `,
      },
      tabAgents: {
        title: '👥 AGENTS',
        body: `
          <strong>CAP (Capture)</strong> — Chance de capturer automatiquement des Pokémon dans les zones non-ouvertes. Plus c'est haut, plus l'agent est efficace.<br><br>
          <strong>LCK (Chance)</strong> — Influence la rareté des captures passives et la qualité des récompenses de coffres.<br><br>
          <strong>ATK (Combat)</strong> — Puissance en combat automatique. Un agent fort bat des dresseurs difficiles.<br><br>
          <strong>Grade</strong> — Grunt → Lieutenant (50+ combats gagnés) → Captain (200+). Chaque grade donne un bonus ATK.<br><br>
          <strong>Zone assignée</strong> — L'agent farm passivement : captures, combats contre dresseurs, ouverture de coffres.<br><br>
          <span class="dim">Un agent sans zone assignée ne fait rien. Assigne-les toujours !</span>
        `,
      },
      tabZones: {
        title: '🗺️ ZONES',
        body: `
          <strong>Zone de capture</strong> (field / safari / water / cave) — Des Pokémon sauvages apparaissent. Agents et Boss capturent automatiquement.<br><br>
          <strong>Zone d'arène</strong> (gym / elite) — Uniquement des combats. Récompenses en ₽ et réputation élevées.<br><br>
          <strong>Récolte ₽</strong> — Les gains de combat s'accumulent (icône jaune ₽). Clique pour lancer une récolte avec combat défensif.<br><br>
          <strong>Maîtrise ★</strong> — Augmente avec les victoires. Améliore les spawns et débloque des dresseurs élites.<br><br>
          <strong>Slots d'agents</strong> — Coût en réputation, croissant avec le niveau de la zone.<br><br>
          <span class="dim">Les zones dégradées (⚠) n'ont que des combats — remonte ta réputation pour les débloquer.</span>
        `,
      },
      tabMarket: {
        title: '💰 MARCHÉ',
        body: `
          <strong>Quêtes horaires</strong> — 3 quêtes Moyennes + 2 Difficiles, réinitialisées toutes les heures. Reroll possible contre 10 rep.<br><br>
          <strong>Histoire & Objectifs</strong> — Quêtes permanentes liées à la progression. Complète-les pour des grosses récompenses.<br><br>
          <strong>Balls</strong> — Chaque type améliore le potentiel max capturé. Troc (onglet Troc) : 10 PB→1 GB, 10 GB→1 UB, 100 UB⇄1 MB.<br><br>
          <strong>Multiplicateur ×1/×5/×10</strong> — Achète en lot depuis la boutique.<br><br>
          <strong>Boosts temporaires</strong> — S'activent depuis le Sac dans la fenêtre de zone. Durée 60–90s.<br><br>
          <span class="dim">Vends des Pokémon depuis le PC pour financer tes achats.</span>
        `,
      },
      tabPC: {
        title: '💻 PC',
        body: `
          <strong>Potentiel ★</strong> — Permanent, détermine le plafond de puissance. ★5 = top tier. Dépend de la Ball utilisée.<br><br>
          <strong>Nature</strong> — Chaque nature booste 2 stats et en pénalise 1. <em>Hardy</em> = équilibré.<br><br>
          <strong>ATK/DEF/SPD</strong> — Calculées depuis base × nature × niveau × potentiel.<br><br>
          <strong>Vente</strong> — Prix = rareté × potentiel × nature. Pas de malus de revente.<br><br>
          <strong>Labo</strong> — Fais évoluer tes Pokémon (pierre ou niveau requis).<br><br>
          <strong>Pension</strong> — 2 Pokémon compatibles → oeuf. Nécessite un incubateur. Les Pokémon de pension ont le "mal du pays" et ne peuvent pas être vendus.<br><br>
          <strong>Oeufs</strong> — Gère tes oeufs en attente d'incubation ou prêts à éclore.<br><br>
          <span class="dim">Filtre par rareté, type ou shiny pour retrouver facilement tes Pokémon.</span>
        `,
      },
      tabPokedex: {
        title: '📖 POKÉDEX',
        body: `
          <strong>Vu 👁</strong> — Tu as aperçu ce Pokémon dans une zone (spawn visible).<br><br>
          <strong>Capturé ✓</strong> — Tu en possèdes au moins un dans ton PC.<br><br>
          <strong>Shiny ✨</strong> — Tu as capturé une version chromatique. Chance de base très faible, boostée par l'Aura Shiny.<br><br>
          <strong>Progression</strong> — Compléter le Pokédex donne des bonus de réputation et de récompenses de quêtes.<br><br>
          <span class="dim">Les légendaires et très rares n'apparaissent que dans des zones spécifiques avec le bon équipement.</span>
        `,
      },
    };

    const info = INFO[tabId];
    if (!info) return;

    document.getElementById('infoModalTitle').textContent = info.title;
    document.getElementById('infoModalBody').innerHTML = info.body;
    document.getElementById('infoModal').classList.add('active');
  }

  // Export helpers to the global scope.
  Object.assign(globalThis, {
    showConfirm,
    showInfoModal,
  });
})();