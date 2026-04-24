/* Dopamine popup helpers extracted from app.js
 *
 * This module encapsulates helper functions that display shiny and rare
 * encounter popups.  It also installs a click handler for the rare popup
 * so that clicking the popup opens the corresponding zone.  The functions
 * `showShinyPopup` and `showRarePopup` are exported to the global scope.
 */
(() => {
  // Alias needed globals from the main application.
  const state          = globalThis.state;
  const openZones      = globalThis.openZones;
  const renderZonesTab = globalThis.renderZonesTab;
  const switchTab      = globalThis.switchTab;
  const ZONE_BY_ID     = globalThis.ZONE_BY_ID;
  const speciesName    = globalThis.speciesName;
  const pokeSprite     = globalThis.pokeSprite;

  let _shinyPopupTimer = null;

  /** Affiche un popup shiny pour un Pokémon donné. */
  function showShinyPopup(species_en) {
    try {
      const el     = document.getElementById('shinyPopup');
      const sprite = document.getElementById('shinyPopupSprite');
      const label  = document.getElementById('shinyPopupLabel');
      if (!el) return;
      sprite.src = pokeSprite(species_en, true);
      label.textContent =
        (state.lang === 'fr' ? '✨ SHINY ' : '✨ SHINY ') +
        speciesName(species_en) +
        ' !';
      el.classList.add('show');
      clearTimeout(_shinyPopupTimer);
      _shinyPopupTimer = setTimeout(() => el.classList.remove('show'), 3000);
    } catch {
      // Silently ignore errors.
    }
  }

  let _rarePopupTimer = null;

  /** Affiche un popup rare avec un indice de zone. */
  function showRarePopup(species_en, zoneId) {
    try {
      const el     = document.getElementById('rarePopup');
      const sprite = document.getElementById('rarePopupSprite');
      const label  = document.getElementById('rarePopupLabel');
      const hint   = document.getElementById('rarePopupHint');
      if (!el) return;
      sprite.src = pokeSprite(species_en);
      label.textContent =
        (state.lang === 'fr' ? '⚡ Rare aperçu : ' : '⚡ Rare spotted: ') +
        speciesName(species_en);

      // Afficher le nom de la zone et le hint cliquable
      if (zoneId && hint) {
        const zone = ZONE_BY_ID[zoneId];
        const zoneName = zone ? (state.lang === 'fr' ? zone.fr : zone.en) : zoneId;
        hint.textContent = `→ ${zoneName}`;
      } else if (hint) {
        hint.textContent = '';
      }

      // Stocker le zoneId pour le clic
      el.dataset.targetZone = zoneId || '';

      el.classList.add('show');
      clearTimeout(_rarePopupTimer);
      _rarePopupTimer = setTimeout(() => el.classList.remove('show'), 3500);
    } catch {
      // Silently ignore errors.
    }
  }

  // ── Clic sur le popup rare → switch vers la zone ──────────────
  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('rarePopup');
    if (!el) return;
    el.addEventListener('click', () => {
      const zoneId = el.dataset.targetZone;
      if (!zoneId) return;
      clearTimeout(_rarePopupTimer);
      el.classList.remove('show');
      // Ouvrir l'onglet Zones et y ouvrir la zone cible
      switchTab('tabZones');
      // S'assurer que la zone est ouverte dans les fenêtres
      if (!openZones.has(zoneId)) {
        openZones.add(zoneId);
        if (!state.openZoneOrder) state.openZoneOrder = [];
        if (!state.openZoneOrder.includes(zoneId)) state.openZoneOrder.push(zoneId);
      }
      renderZonesTab();
      // Scroll vers la fenêtre de zone après le rendu
      setTimeout(() => {
        const zoneWin = document.getElementById(`zw-${zoneId}`);
        zoneWin?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Bref highlight visuel
        zoneWin?.classList.add('zone-highlight');
        setTimeout(() => zoneWin?.classList.remove('zone-highlight'), 1500);
      }, 100);
    });
  });

  // Export helper functions to the global scope.
  Object.assign(globalThis, {
    showShinyPopup,
    showRarePopup,
  });
})();