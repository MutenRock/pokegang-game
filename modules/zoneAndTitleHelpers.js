/* Zone and Title helper module extracted from app.js
 *
 * This module defines constants and helper functions related to zones and gang
 * titles.  It exports the base costs for unlocking additional agent slots
 * (`ZONE_SLOT_COSTS`), the list of liaison words used when composing full
 * titles (`LIAISONS`), and a set of functions for retrieving and updating
 * title information.  All exports are attached to `globalThis` so that
 * existing code continues to function.
 */
(() => {
  // Alias necessary global variables.
  const state        = globalThis.state;
  const TITLES       = globalThis.TITLES;
  const POKEMON_GEN1 = globalThis.POKEMON_GEN1;
  const notify       = globalThis.notify;
  const saveState    = globalThis.saveState;

  // Coûts en ₽ pour débloquer des slots d'agents par zone
  // slot 2 → 2000₽, slot 3 → 6000₽, etc.
  const ZONE_SLOT_COSTS = [2000, 6000, 15000, 50000, 150000];

  // → Moved to data/titles-data.js
  // Termes de liaison utilisés pour former des titres composés
  const LIAISONS = ['', 'de', "de l'", 'du', 'des', 'à', 'et', '&', 'alias', 'dit'];

  /**
   * Retourne le label d'un titre à partir de son identifiant.
   */
  function getTitleLabel(titleId) {
    return TITLES.find(t => t.id === titleId)?.label || '';
  }

  /**
   * Construit le titre complet du boss du gang en combinant deux titres et
   * un éventuel terme de liaison.  Renvoie 'Recrue' si aucun titre n'est
   * sélectionné.
   */
  function getBossFullTitle() {
    const t1  = getTitleLabel(state.gang.titleA);
    const t2  = getTitleLabel(state.gang.titleB);
    const lia = state.gang.titleLiaison || '';
    if (!t1 && !t2) return 'Recrue';
    if (t1 && !t2) return t1;
    if (!t1 && t2) return t2;
    return `${t1}${lia ? ' ' + lia : ''} ${t2}`;
  }

  /**
   * Vérifie les titres du gang qui peuvent être débloqués en fonction de
   * l'état actuel (réputation, captures, statistiques, etc.).  Met à jour
   * la liste des titres débloqués et affiche une notification pour chaque
   * nouveau titre obtenu.
   */
  function checkTitleUnlocks() {
    const unlocked = new Set(state.unlockedTitles || []);
    const newOnes  = [];
    for (const t of TITLES) {
      if (unlocked.has(t.id)) continue;
      let unlock = false;
      if (t.category === 'rep') {
        unlock = state.gang.reputation >= t.repReq;
      } else if (t.category === 'type_capture') {
        const count = state.pokemons.filter(p => {
          const sp = POKEMON_GEN1.find(s => s.en === p.species_en);
          return sp?.types?.includes(t.typeReq);
        }).length;
        unlock = count >= t.countReq;
      } else if (t.category === 'stat') {
        unlock = (state.stats[t.statReq] || 0) >= t.countReq;
      } else if (t.category === 'special' && t.id === 'fondateur') {
        unlock = true; // toujours débloqué
      } else if (t.category === 'special' && t.id === 'glitcheur') {
        unlock = state.pokemons.some(p => p.species_en === 'missingno');
      } else if (t.category === 'pokedex') {
        if (t.dexType === 'kanto') {
          const kantoCount = POKEMON_GEN1.filter(s => !s.hidden && s.dex >= 1 && s.dex <= 151 && state.pokedex[s.en]?.caught).length;
          const kantoTotal = POKEMON_GEN1.filter(s => !s.hidden && s.dex >= 1 && s.dex <= 151).length;
          unlock = kantoCount >= kantoTotal;
        } else if (t.dexType === 'full') {
          const fullCount = POKEMON_GEN1.filter(s => !s.hidden && state.pokedex[s.en]?.caught).length;
          const fullTotal = POKEMON_GEN1.filter(s => !s.hidden).length;
          unlock = fullCount >= fullTotal;
        }
      } else if (t.category === 'shiny_special') {
        if (t.shinyType === 'starters') {
          unlock = ['bulbasaur','charmander','squirtle'].every(s => state.pokedex[s]?.shiny);
        } else if (t.shinyType === 'legendaries') {
          unlock = POKEMON_GEN1.filter(s => s.rarity === 'legendary' && !s.hidden).every(s => state.pokedex[s.en]?.shiny);
        } else if (t.shinyType === 'full_dex') {
          unlock = POKEMON_GEN1.filter(s => !s.hidden).every(s => state.pokedex[s.en]?.shiny);
        }
      }
      if (unlock) { unlocked.add(t.id); newOnes.push(t); }
    }
    if (newOnes.length > 0) {
      state.unlockedTitles = [...unlocked];
      // Set default titleA to best rep title if none selected
      if (!state.gang.titleA) state.gang.titleA = state.unlockedTitles[0] || 'recrue';
      newOnes.forEach(t => notify(`🏆 Titre débloqué : "${t.label}" !`, 'gold'));
      saveState();
    }
  }

  // Export constants and helpers to the global namespace.
  Object.assign(globalThis, {
    ZONE_SLOT_COSTS,
    LIAISONS,
    getTitleLabel,
    getBossFullTitle,
    checkTitleUnlocks,
  });
})();