/* Core utilities module extracted from app.js */
(function(global) {
  // Alias frequently accessed globals
  const state = global.state;
  const SPECIES_BY_EN = global.SPECIES_BY_EN;
  const getPokemonSprite = global.getPokemonSprite;
  // Additional aliases for globals referenced in this module
  const openZones = global.openZones;
  const getAgentRecruitCost = global.getAgentRecruitCost;
  const ZONES = global.ZONES;
  const isZoneUnlocked = global.isZoneUnlocked;
  const saveState = global.saveState;
//  3.  CORE UTILS
// ════════════════════════════════════════════════════════════════

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function formatIncome(n) {
  if (n >= 10000) return Math.round(n / 1000) + 'k';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toString();
}
function weightedPick(arr) {
  // arr: [{en, w}, ...] — returns en string
  const total = arr.reduce((s, e) => s + e.w, 0);
  let r = Math.random() * total;
  for (const e of arr) { r -= e.w; if (r <= 0) return e.en; }
  return arr[arr.length - 1].en;
}
function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function addLog(msg) {
  state.log.unshift({ msg, ts: Date.now() });
  if (state.log.length > 50) state.log.length = 50;
}

function sanitizeSpriteName(en) {
  // Showdown sprites use no hyphens for nidoran: nidoranf, nidoranm
  // and some others like mr-mime -> mrmime, farfetchd, etc.
  return en.replace(/[^a-z0-9]/g, '');
}

// ── Pokémon sprite resolution ────────────────────────────────────────────────
// Variants disponibles (depuis pokemon-sprites-kanto.json) :
//   'main'         → FireRed/LeafGreen (défaut)
//   'showdown'     → Animated GIF Showdown
//   'icon'         → Icône miniature Gen 7
//   'artwork'      → Artwork officiel haute résolution
//   'artworkShiny' → Artwork officiel shiny
//   'back'         → Dos face
//   'shiny'        → Version brillante face
//   'backShiny'    → Dos brillant
//   'retroRedBlue' → Sprite Rogue/Bleu
//   'retroYellow'  → Sprite Jaune
function pokeSpriteVariant(en, variant = 'main', shiny = false) {
  // Mode classique (Showdown Gen 5 animés) ou variante explicitement Showdown → bypass JSON
  const classic = state?.settings?.classicSprites || variant === 'showdown';
  if (!classic) {
    const sp = SPECIES_BY_EN[en];
    const dexId = sp?.dex;
    if (dexId && typeof getPokemonSprite === 'function') {
      const key = shiny && variant === 'main' ? 'shiny'
                : shiny && variant === 'back'  ? 'backShiny'
                : variant;
      const url = getPokemonSprite(dexId, key);
      if (url) return url;
    }
  }
  // Fallback / mode classique : Showdown Gen 5
  const base = shiny ? 'gen5-shiny' : 'gen5';
  return `https://play.pokemonshowdown.com/sprites/${base}/${sanitizeSpriteName(en)}.png`;
}

function pokeSprite(en, shiny = false) {
  return pokeSpriteVariant(en, 'main', shiny);
}

function pokeSpriteBack(en, shiny = false) {
  if (!state?.settings?.classicSprites) {
    const sp = SPECIES_BY_EN[en];
    const dexId = sp?.dex;
    if (dexId && typeof getPokemonSprite === 'function') {
      const url = getPokemonSprite(dexId, shiny ? 'backShiny' : 'back');
      if (url) return url;
    }
  }
  const base = shiny ? 'gen5-back-shiny' : 'gen5-back';
  return `https://play.pokemonshowdown.com/sprites/${base}/${sanitizeSpriteName(en)}.png`;
}

const SPRITE_FIX = {
  // ltsurge, rocketgrunt, rocketgruntf exist directly on Showdown — no fix needed
  // Elite Four sprites need suffix
  agatha:          'agatha-gen1',
  lorelei:         'lorelei-gen1',
  phoebe:          'phoebe-gen3',
  drake:           'drake-gen3',
  // Common trainers that 404 without suffix
  channeler:       'channeler-gen1',
  cueball:         'cueball-gen1',
  rocker:          'rocker-gen1',
  tamer:           'tamer-gen1',
  // cooltrainer doesn't exist on Showdown → use acetrainer
  cooltrainer:     'acetrainer',
  cooltrainerf:    'acetrainerf',
  // New trainers — pick the most iconic version
  rocketexecutive: 'rocketexecutive-gen2',
  pokemonrangerf:  'pokemonrangerf-gen3',
  policeman:       'policeman-gen8',
};

// Custom sprite overrides (non-Showdown sources)
const CUSTOM_TRAINER_SPRITES = {
  giovanni: 'https://www.pokepedia.fr/images/archive/7/73/20230124191924%21Sprite_Giovanni_RB.png',
};

// ── Trainer sprite resolution ────────────────────────────────────────────────
// Index à plat construit après chargement de trainer-sprites-grouped.json
const _trainerJsonIndex = {};

function _buildTrainerIndex(data) {
  // `data` = résultat de loadTrainerGroups() — TRAINER_GROUPS n'est plus global (IIFE loaders.js)
  if (!data?.trainers) return;
  const base = 'https://play.pokemonshowdown.com/sprites/trainers/';
  const groups = data.trainers;
  for (const [groupName, groupData] of Object.entries(groups)) {
    if (groupName === 'factions') {
      for (const [, arr] of Object.entries(groupData)) {
        if (Array.isArray(arr)) arr.forEach(rel => {
          const slug = rel.replace(/\.png$/, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
          _trainerJsonIndex[slug] = base + rel;
        });
      }
    } else if (typeof groupData === 'object' && !Array.isArray(groupData)) {
      for (const [key, rel] of Object.entries(groupData)) {
        const slug = rel.replace(/\.png$/, '').toLowerCase();
        const keyNorm = key.replace(/[^a-z0-9]/gi, '').toLowerCase();
        _trainerJsonIndex[slug] = base + rel;
        _trainerJsonIndex[keyNorm] = base + rel;
      }
    }
  }
}

function trainerSprite(name) {
  if (CUSTOM_TRAINER_SPRITES[name]) return CUSTOM_TRAINER_SPRITES[name];
  // Chercher dans l'index JSON si disponible
  const norm = (name || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
  if (_trainerJsonIndex[norm]) return _trainerJsonIndex[norm];
  // Fallback Showdown
  const fixed = SPRITE_FIX[name] || name;
  return `https://play.pokemonshowdown.com/sprites/trainers/${fixed}.png`;
}

// SVG placeholder fallbacks (inline data URIs — no network dependency)
const FALLBACK_TRAINER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%231a1a1a'/%3E%3Ccircle cx='32' cy='20' r='10' fill='%23444'/%3E%3Cellipse cx='32' cy='50' rx='16' ry='14' fill='%23444'/%3E%3Ctext x='32' y='62' text-anchor='middle' font-size='8' fill='%23666'%3E%3F%3F%3C/text%3E%3C/svg%3E`;
const FALLBACK_POKEMON_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%231a1a1a'/%3E%3Cellipse cx='32' cy='36' rx='20' ry='18' fill='%23333'/%3E%3Ccircle cx='32' cy='18' r='10' fill='%23333'/%3E%3Ctext x='32' y='62' text-anchor='middle' font-size='8' fill='%23555'%3E%3F%3C/text%3E%3C/svg%3E`;

// Safe image helpers — with automatic fallback on load error
function safeTrainerImg(name, { style = '', cls = '' } = {}) {
  const src = trainerSprite(name);
  return `<img src="${src}" ${cls ? `class="${cls}"` : ''} style="${style}" alt="${name}" onerror="this.src='${FALLBACK_TRAINER_SVG}';this.onerror=null">`;
}
function safePokeImg(species_en, { shiny = false, back = false, variant = 'main', style = '', cls = '' } = {}) {
  const src = back ? pokeSpriteBack(species_en, shiny) : pokeSpriteVariant(species_en, variant, shiny);
  return `<img src="${src}" ${cls ? `class="${cls}"` : ''} style="${style}" alt="${species_en}" onerror="this.src='${FALLBACK_POKEMON_SVG}';this.onerror=null">`;
}

function speciesName(en) {
  if (!SPECIES_BY_EN[en]) return en;
  return state.lang === 'fr' ? SPECIES_BY_EN[en].fr : en.charAt(0).toUpperCase() + en.slice(1);
}

function pokemonDisplayName(p) {
  return p.nick || speciesName(p.species_en);
}

// ════════════════════════════════════════════════════════════════
// SESSION TRACKING  (30-min idle = nouvelle session)
// ════════════════════════════════════════════════════════════════
const SESSION_KEY     = 'pg_session_baseline';
const SESSION_IDLE_MS = 30 * 60 * 1000;
let _sessionBaseline  = null;

function initSession() {
  const now = Date.now();
  const raw = localStorage.getItem(SESSION_KEY);
  if (raw) {
    try {
      const saved = JSON.parse(raw);
      if (now - saved.ts < SESSION_IDLE_MS) {
        _sessionBaseline = saved;
        // Migration : anciens saves de session sans caught/sold
        if (_sessionBaseline.caughtAtStart === undefined) _sessionBaseline.caughtAtStart = state.stats.totalCaught || 0;
        if (_sessionBaseline.soldAtStart   === undefined) _sessionBaseline.soldAtStart   = state.stats.totalSold   || 0;
        return; // session en cours — on la continue
      }
    } catch {}
  }
  // Nouvelle session
  _sessionBaseline = {
    ts:           now,
    money:        state.gang.money,
    rep:          state.gang.reputation,
    pokemon:      state.pokemons.length,
    shinies:      state.stats.shinyCaught    || 0,
    fights:       state.stats.totalFightsWon || 0,
    caughtAtStart: state.stats.totalCaught   || 0,
    soldAtStart:   state.stats.totalSold     || 0,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(_sessionBaseline));
}

function _saveSessionActivity() {
  if (_sessionBaseline) {
    _sessionBaseline.ts = Date.now();
    localStorage.setItem(SESSION_KEY, JSON.stringify(_sessionBaseline));
  }
}

function getSessionDelta() {
  if (!_sessionBaseline) return null;
  const dMoney  = state.gang.money            - _sessionBaseline.money;
  const dRep    = state.gang.reputation       - _sessionBaseline.rep;
  const dCaught = (state.stats.totalCaught   || 0) - (_sessionBaseline.caughtAtStart || 0);
  const dSold   = (state.stats.totalSold     || 0) - (_sessionBaseline.soldAtStart   || 0);
  const dShiny  = (state.stats.shinyCaught   || 0) - (_sessionBaseline.shinies       || 0);
  const dFights = (state.stats.totalFightsWon|| 0) - (_sessionBaseline.fights        || 0);

  const parts = [];
  const fmtPos = (v, icon) => {
    if (v <= 0) return null;
    const color = 'var(--green-dim,#4a8)';
    return `<span style="color:${color}">+${Math.abs(v) >= 1000 ? v.toLocaleString() : v} ${icon}</span>`;
  };
  const fmtAny = (v, icon) => {
    if (v === 0) return null;
    const sign  = v > 0 ? '+' : '';
    const color = v > 0 ? 'var(--green-dim,#4a8)' : 'var(--red)';
    return `<span style="color:${color}">${sign}${Math.abs(v) >= 1000 ? v.toLocaleString() : v} ${icon}</span>`;
  };

  if (dMoney  !== 0) parts.push(fmtAny(dMoney,  '₽'));
  if (dCaught  > 0)  parts.push(fmtPos(dCaught, '🎯'));
  if (dSold    > 0)  parts.push(`<span style="color:var(--text-dim)">-${dSold} 💱</span>`);
  if (dRep    !== 0) parts.push(fmtAny(dRep,    '⭐'));
  if (dShiny   > 0)  parts.push(fmtPos(dShiny,  '✨'));
  if (dFights  > 0)  parts.push(fmtPos(dFights, '⚔'));
  return parts.filter(Boolean).join(' · ');
}

// ════════════════════════════════════════════════════════════════
// NEXT OBJECTIVE
// ════════════════════════════════════════════════════════════════
function getNextObjective() {
  const pc     = state.pokemons.length;
  const team   = state.gang.bossTeam.length;
  const agents = state.agents.length;
  const money  = state.gang.money;
  const rep    = state.gang.reputation;
  const zones  = openZones ? openZones.size : 0;
  const dex    = Object.values(state.pokedex).filter(e => e.caught).length;

  if (!state.gang.initialized)
    return { text: '👋 Crée ton Gang pour commencer', tab: null };
  if (pc === 0)
    return { text: '⚡ Capture ton premier Pokémon', detail: '→ Zones', tab: 'tabZones' };
  if (team === 0)
    return { text: '⚔ Place un Pokémon dans ton équipe Boss', detail: '→ PC', tab: 'tabPC' };
  if (team < 3)
    return { text: `⚔ Complète ton équipe Boss`, detail: `${team}/3`, tab: 'tabPC' };
  if (agents === 0) {
    const cost = typeof getAgentRecruitCost === 'function' ? getAgentRecruitCost() : 10000;
    const progress = money >= cost ? 'Prêt !' : `₽${money.toLocaleString()}/${cost.toLocaleString()}`;
    return { text: '👤 Recrute ton premier agent', detail: progress, tab: 'tabPC' };
  }
  // Zone suivante verrouillée
  const nextLocked = ZONES ? ZONES.find(z => !isZoneUnlocked(z.id)) : null;
  if (nextLocked) {
    const req = nextLocked.repRequired || 0;
    if (req > 0)
      return { text: `🗺 Débloquer ${nextLocked.fr}`, detail: `Rép. ${rep}/${req}`, tab: 'tabZones' };
  }
  if (agents < 3)
    return { text: `👥 Avoir ${agents+1} agents`, detail: `${agents}/3`, tab: 'tabAgents' };
  if (dex < 151)
    return { text: `📖 Pokédex ${dex}/151`, detail: `${151 - dex} espèces manquantes`, tab: 'tabPokedex' };
  return { text: '🏆 Pokédex complet — Tu domines Kanto !', detail: null, tab: null };
}

// ── Boost helpers ─────────────────────────────────────────────
function isBoostActive(boostId) {
  return (state.activeBoosts[boostId] || 0) > Date.now();
}
function boostRemaining(boostId) {
  const exp = state.activeBoosts[boostId] || 0;
  return Math.max(0, Math.ceil((exp - Date.now()) / 1000));
}
// Boost durations in ms per item type
const BOOST_DURATIONS = {
  incense:   90000,
  rarescope: 90000,
  aura:      90000,
  lure:      60000,
  superlure: 60000,
};

function activateBoost(boostId) {
  if ((state.inventory[boostId] || 0) <= 0) return false;
  state.inventory[boostId]--;
  const duration = BOOST_DURATIONS[boostId] || 90000;
  // Cumulate: extend from current expiry if already active, else from now
  const base = Math.max(Date.now(), state.activeBoosts[boostId] || 0);
  state.activeBoosts[boostId] = base + duration;
  saveState();
  return true;
}

// Ball sprites — Showdown primary, PokeAPI fallback
const BALL_SPRITES = {
  pokeball:  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
  greatball: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png',
  ultraball: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png',
  duskball:  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dusk-ball.png',
};

// Item sprites — PokeAPI (renommé ITEM_SPRITE_URLS pour éviter collision avec loaders.js)
const ITEM_SPRITE_URLS = {
  pokeball:   'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
  greatball:  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png',
  ultraball:  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png',
  duskball:   'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dusk-ball.png',
  masterball: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png',
  lure:       'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/honey.png',
  superlure:  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/lure-ball.png',
  potion:     'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/potion.png',
  incense:    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/luck-incense.png',
  rarescope:  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/scope-lens.png',
  aura:       'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/shiny-stone.png',
  evostone:   'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/fire-stone.png',
  rarecandy:  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rare-candy.png',
  chestBoost: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/big-nugget.png',
  translator: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-flute.png',
  mysteryegg: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/oval-stone.png',
  incubator:    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/oval-stone.png',
  map_pallet:   'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/town-map.png',
  casino_ticket:'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/coin-case.png',
  silph_keycard:'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/silph-scope.png',
  boat_ticket:  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ss-ticket.png',
  pokecoin:     'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/amulet-coin.png',
  silver_wing:  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/silver-wing.png',
  rainbow_wing: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rainbow-wing.png',
};
function itemSprite(id) {
  const url = ITEM_SPRITE_URLS[id];
  return url
    ? `<img src="${url}" style="width:28px;height:28px;image-rendering:pixelated" onerror="this.style.display='none'">`
    : `<span style="font-family:var(--font-pixel);font-size:8px;color:var(--text-dim)">${id.toUpperCase().slice(0,3)}</span>`;
}

// Translator Pokemon
const TRANSLATOR_PHRASES_FR = [
  'Je vais te montrer ma vraie puissance !',
  'Je suis le meilleur du quartier.',
  'Tu ferais mieux de reculer.',
  'Mon dresseur m\'a bien prepare.',
  'Je n\'ai pas peur de toi !',
  'On va voir ce que tu vaux.',
  'Je combats pour mon equipe.',
  'Tu ne passeras pas !',
];

// PC sub-view state
let pcView = 'grid'; // 'grid' | 'lab'
let _pcLastRenderKey = ''; // tracks last filter/sort/page combo to avoid unnecessary rebuilds

// Chest sprite URL
const CHEST_SPRITE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rare-candy.png';

// ── SFX Engine (Web Audio API) ────────────────────────────────
const SFX = (() => {
  let ctx;
  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }
  function playTone(freq, duration, type = 'square', volume = 0.15) {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    const sfxMult = (state?.settings?.sfxVol ?? 80) / 100;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    gain.gain.setValueAtTime(volume * sfxMult, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + duration + 0.05); // +50 ms buffer → élimine le click/scratch à l'arrêt
  }
  return {
    ballThrow() {
      // Whoosh sound: descending noise
      playTone(800, 0.15, 'sawtooth', 0.08);
      setTimeout(() => playTone(400, 0.1, 'sawtooth', 0.06), 80);
    },
    capture(potential, shiny) {
      // Base capture jingle
      const base = 520;
      playTone(base, 0.12, 'square', 0.12);
      setTimeout(() => playTone(base * 1.25, 0.12, 'square', 0.12), 100);
      setTimeout(() => playTone(base * 1.5, 0.15, 'square', 0.12), 200);
      // Extra notes for high potential
      if (potential >= 4) {
        setTimeout(() => playTone(base * 2, 0.2, 'square', 0.15), 320);
      }
      if (potential >= 5 || shiny) {
        setTimeout(() => playTone(base * 2.5, 0.25, 'sine', 0.18), 440);
        setTimeout(() => playTone(base * 3, 0.3, 'sine', 0.15), 580);
      }
      if (shiny) {
        // Sparkle effect
        setTimeout(() => {
          for (let i = 0; i < 5; i++) {
            setTimeout(() => playTone(1200 + i * 200, 0.08, 'sine', 0.1), i * 60);
          }
        }, 700);
      }
    },
    error() {
      playTone(200, 0.2, 'sawtooth', 0.1);
    },
    levelUp() {
      // Ascending fanfare
      playTone(523, 0.1, 'square', 0.1);
      setTimeout(() => playTone(659, 0.1, 'square', 0.1), 110);
      setTimeout(() => playTone(784, 0.15, 'square', 0.1), 220);
      setTimeout(() => playTone(1047, 0.2, 'sine',  0.12), 360);
    },
    coin() {
      // Money sound
      playTone(988, 0.06, 'sine', 0.1);
      setTimeout(() => playTone(1318, 0.1, 'sine', 0.1), 80);
    },
    click() {
      // UI button click — tick léger
      playTone(1200, 0.04, 'square', 0.05);
    },
    tabSwitch() {
      // Changement d'onglet — glissement court
      playTone(660, 0.06, 'sine', 0.07);
      setTimeout(() => playTone(880, 0.05, 'sine', 0.05), 50);
    },
    buy() {
      // Achat confirmé — coin sound plus grave
      playTone(659, 0.08, 'sine', 0.1);
      setTimeout(() => playTone(880, 0.12, 'sine', 0.12), 80);
    },
    unlock() {
      // Déverrouillage / découverte — fanfare ascendante
      playTone(440, 0.08, 'square', 0.1);
      setTimeout(() => playTone(554, 0.08, 'square', 0.1), 100);
      setTimeout(() => playTone(659, 0.08, 'square', 0.1), 200);
      setTimeout(() => playTone(880, 0.16, 'sine',   0.12), 310);
      setTimeout(() => playTone(1108, 0.2, 'sine',   0.1),  450);
    },
    menuOpen() {
      // Ouverture modale / menu
      playTone(880, 0.08, 'sine', 0.07);
      setTimeout(() => playTone(1100, 0.1, 'sine', 0.06), 80);
    },
    menuClose() {
      // Fermeture modale
      playTone(660, 0.07, 'sine', 0.06);
      setTimeout(() => playTone(440, 0.09, 'sine', 0.05), 70);
    },
    chest() {
      // Coffre ouvert — effet magique
      playTone(660, 0.08, 'square', 0.08);
      setTimeout(() => playTone(880, 0.08, 'square', 0.09), 80);
      setTimeout(() => playTone(1100, 0.08, 'square', 0.1), 160);
      setTimeout(() => {
        for (let i = 0; i < 4; i++) {
          setTimeout(() => playTone(1200 + i * 180, 0.07, 'sine', 0.07), i * 55);
        }
      }, 260);
    },
    notify() {
      // Notification — ping doux
      playTone(880, 0.07, 'sine', 0.08);
      setTimeout(() => playTone(1108, 0.1, 'sine', 0.07), 90);
    },
    sell() {
      // Vente Pokémon
      playTone(660, 0.05, 'sine', 0.08);
      setTimeout(() => playTone(440, 0.08, 'sawtooth', 0.06), 70);
    },
    evolve() {
      // Évolution — fanfare complète
      const notes = [523, 659, 784, 1047, 1319];
      notes.forEach((f, i) => setTimeout(() => playTone(f, 0.15, 'square', 0.12), i * 120));
      setTimeout(() => {
        for (let i = 0; i < 6; i++) setTimeout(() => playTone(1200 + i * 150, 0.1, 'sine', 0.1), i * 60);
      }, notes.length * 120 + 100);
    },
    _enabled() { return state?.settings?.sfxEnabled !== false; },
    play(name, ...args) {
      if (!this._enabled()) return;
      if (state?.settings?.sfxIndividual?.[name] === false) return;
      try { this[name]?.(...args); } catch {}
    },
  };
})();

// ════════════════════════════════════════════════════════════════
  // Export selected functions and variables to the global scope
  const exported = {
    pick: typeof pick !== "undefined" ? pick : undefined,
    formatIncome: typeof formatIncome !== "undefined" ? formatIncome : undefined,
    weightedPick: typeof weightedPick !== "undefined" ? weightedPick : undefined,
    randInt: typeof randInt !== "undefined" ? randInt : undefined,
    uid: typeof uid !== "undefined" ? uid : undefined,
    clamp: typeof clamp !== "undefined" ? clamp : undefined,
    addLog: typeof addLog !== "undefined" ? addLog : undefined,
    sanitizeSpriteName: typeof sanitizeSpriteName !== "undefined" ? sanitizeSpriteName : undefined,
    pokeSpriteVariant: typeof pokeSpriteVariant !== "undefined" ? pokeSpriteVariant : undefined,
    pokeSprite: typeof pokeSprite !== "undefined" ? pokeSprite : undefined,
    pokeSpriteBack: typeof pokeSpriteBack !== "undefined" ? pokeSpriteBack : undefined,
    _buildTrainerIndex: typeof _buildTrainerIndex !== "undefined" ? _buildTrainerIndex : undefined,
    trainerSprite: typeof trainerSprite !== "undefined" ? trainerSprite : undefined,
    safeTrainerImg: typeof safeTrainerImg !== "undefined" ? safeTrainerImg : undefined,
    safePokeImg: typeof safePokeImg !== "undefined" ? safePokeImg : undefined,
    speciesName: typeof speciesName !== "undefined" ? speciesName : undefined,
    pokemonDisplayName: typeof pokemonDisplayName !== "undefined" ? pokemonDisplayName : undefined,
    initSession: typeof initSession !== "undefined" ? initSession : undefined,
    _saveSessionActivity: typeof _saveSessionActivity !== "undefined" ? _saveSessionActivity : undefined,
    getSessionDelta: typeof getSessionDelta !== "undefined" ? getSessionDelta : undefined,
    getNextObjective: typeof getNextObjective !== "undefined" ? getNextObjective : undefined,
    isBoostActive: typeof isBoostActive !== "undefined" ? isBoostActive : undefined,
    boostRemaining: typeof boostRemaining !== "undefined" ? boostRemaining : undefined,
    activateBoost: typeof activateBoost !== "undefined" ? activateBoost : undefined,
    itemSprite: typeof itemSprite !== "undefined" ? itemSprite : undefined,
    getCtx: typeof getCtx !== "undefined" ? getCtx : undefined,
    playTone: typeof playTone !== "undefined" ? playTone : undefined,
    SPRITE_FIX: typeof SPRITE_FIX !== "undefined" ? SPRITE_FIX : undefined,
    CUSTOM_TRAINER_SPRITES: typeof CUSTOM_TRAINER_SPRITES !== "undefined" ? CUSTOM_TRAINER_SPRITES : undefined,
    _trainerJsonIndex: typeof _trainerJsonIndex !== "undefined" ? _trainerJsonIndex : undefined,
    BOOST_DURATIONS: typeof BOOST_DURATIONS !== "undefined" ? BOOST_DURATIONS : undefined,
    BALL_SPRITES: typeof BALL_SPRITES !== "undefined" ? BALL_SPRITES : undefined,
    ITEM_SPRITE_URLS: typeof ITEM_SPRITE_URLS !== "undefined" ? ITEM_SPRITE_URLS : undefined,
    TRANSLATOR_PHRASES_FR: typeof TRANSLATOR_PHRASES_FR !== "undefined" ? TRANSLATOR_PHRASES_FR : undefined,
    pcView: typeof pcView !== "undefined" ? pcView : undefined,
    _pcLastRenderKey: typeof _pcLastRenderKey !== "undefined" ? _pcLastRenderKey : undefined,
    CHEST_SPRITE_URL: typeof CHEST_SPRITE_URL !== "undefined" ? CHEST_SPRITE_URL : undefined,
    SFX: typeof SFX !== "undefined" ? SFX : undefined,
  };
  Object.entries(exported).forEach(([k,v]) => { if (v !== undefined) global[k] = v; });
})(window);
export {};