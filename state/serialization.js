'use strict';

export const MAX_HISTORY = 30;

export function slimPokemon(pokemon) {
  const s = { ...pokemon };
  delete s.species_fr;
  delete s.dex;
  if (s.assignedTo === null) delete s.assignedTo;
  if (s.cooldown === 0) delete s.cooldown;
  if (s.homesick === false) delete s.homesick;
  if (s.favorite === false) delete s.favorite;
  if (s.xp === 0) delete s.xp;
  if (Array.isArray(s.history) && s.history.length > MAX_HISTORY) {
    s.history = s.history.slice(-MAX_HISTORY);
  }
  if (!s.history || s.history.length === 0) delete s.history;
  return s;
}

export function buildSavePayload(state) {
  return {
    ...state,
    pokemons: Array.isArray(state.pokemons) ? state.pokemons.map(slimPokemon) : [],
  };
}
