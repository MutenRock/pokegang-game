/* Music player module extracted from app.js
 *
 * This module defines background music handling (MUSIC_TRACKS and MusicPlayer),
 * jingle playback (JINGLES and JinglePlayer), and sound effects (SE_SOUNDS
 * and playSE).  All functions and constants are exported to the global
 * `window` object so that existing code can continue to reference them.
 *
 * The module aliases a few global objects (such as `state` and `ZONE_BY_ID`)
 * from `globalThis` to simplify references.  It still reads `activeTab`
 * directly from `globalThis` to reflect changes in the active tab at runtime.
 */
(() => {
  // Alias frequently used globals.  These objects are references to the
  // corresponding values on the main page and will remain up to date.
  const state     = globalThis.state;
  const ZONE_BY_ID = globalThis.ZONE_BY_ID;

  // ════════════════════════════════════════════════════════════════
  // MUSIC TRACK CATALOG
  // ════════════════════════════════════════════════════════════════
  /**
   * MUSIC_TRACKS — catalogue de toutes les pistes audio.
   * Ajoutez des pistes ici + placez les fichiers dans game/music/.
   * Chaque zone référence une clé via sa propriété `music`.
   *
   * Structure :
   *   key:  identifiant unique (référencé dans ZONES[].music)
   *   file: chemin relatif depuis game/
   *   loop: true pour boucle continue
   *   vol:  volume de base 0–1
   */
  const MUSIC_TRACKS = {
    // ── Base / Routes ─────────────────────────────────────────────
    base:        { file: 'music/BGM/First Town.mp3',    loop: true,  vol: 0.45, fr: 'Base du Gang'       },
    forest:      { file: 'music/BGM/Route 1.mp3',       loop: true,  vol: 0.50, fr: 'Route'               },
    cave:        { file: 'music/BGM/Cave.mp3',           loop: true,  vol: 0.45, fr: 'Caverne'             },
    city:        { file: 'music/BGM/Lab.mp3',            loop: true,  vol: 0.50, fr: 'Ville'               },
    sea:         { file: 'music/BGM/Introduction.mp3',   loop: true,  vol: 0.45, fr: 'Mer / Bateau'        },
    safari:      { file: 'music/BGM/Route 1.mp3',        loop: true,  vol: 0.45, fr: 'Parc Safari'         },
    lavender:    { file: 'music/BGM/Cave.mp3',           loop: true,  vol: 0.30, fr: 'Lavanville'          },
    tower:       { file: 'music/BGM/Cave.mp3',           loop: true,  vol: 0.28, fr: 'Tour Pokémon'        },
    mansion:     { file: 'music/BGM/Cave.mp3',           loop: true,  vol: 0.35, fr: 'Manoir Pokémon'      },
    // ── Combat / Arènes ───────────────────────────────────────────
    gym:         { file: 'music/BGM/VSTrainer.mp3',      loop: true,  vol: 0.55, fr: 'Arène'               },
    rocket:      { file: 'music/BGM/VSRival.mp3',        loop: true,  vol: 0.55, fr: 'Team Rocket'         },
    silph:       { file: 'music/BGM/Lab.mp3',            loop: true,  vol: 0.50, fr: 'Sylphe SARL'         },
    elite4:      { file: 'music/BGM/VSLegend.mp3',       loop: true,  vol: 0.60, fr: 'Élite 4 / Sommet'    },
    // ── Ambiances spéciales ────────────────────────────────────────
    casino:      { file: 'music/BGM/MysteryGift.mp3',    loop: true,  vol: 0.55, fr: 'Casino'              },
    halloffame:  { file: 'music/BGM/Hall of Fame.mp3',   loop: false, vol: 0.60, fr: 'Tableau d\'Honneur'  },
    title:       { file: 'music/BGM/Title.mp3',          loop: true,  vol: 0.50, fr: 'Titre'               },
  };

  /**
   * MusicPlayer — gère la lecture de fond avec crossfade.
   * Utilise deux éléments <audio> pour un fondu croisé doux.
   */
  const MusicPlayer = (() => {
    let _trackA = null;   // HTMLAudioElement actif
    let _trackB = null;   // HTMLAudioElement en fondu entrant
    let _current = null;  // clé du morceau en cours

    const FADE_DURATION = 2000; // ms

    function _createAudio(src, vol, loop) {
      const a = new Audio(src);
      a.loop = loop;
      a.volume = 0;
      a.preload = 'auto';
      a.dataset.targetVol = vol;
      return a;
    }

    function _isEnabled() {
      return state?.settings?.musicEnabled === true;
    }

    function _setVol(el, v) {
      if (el) el.volume = Math.max(0, Math.min(1, v));
    }

    function _fade(el, fromVol, toVol, durationMs, onDone) {
      const steps = 30;
      const dt = durationMs / steps;
      const delta = (toVol - fromVol) / steps;
      let step = 0;
      const id = setInterval(() => {
        step++;
        _setVol(el, fromVol + delta * step);
        if (step >= steps) {
          clearInterval(id);
          _setVol(el, toVol);
          if (onDone) onDone();
        }
      }, dt);
      return id;
    }

    return {
      /**
       * Joue la piste `trackId` avec crossfade si une piste est déjà active.
       * Ne fait rien si la piste est déjà en cours ou si la musique est désactivée.
       */
      play(trackId) {
        if (!_isEnabled()) return;
        if (!trackId || !MUSIC_TRACKS[trackId]) return;
        if (_current === trackId) return; // déjà en cours

        const def = MUSIC_TRACKS[trackId];
        const newAudio = _createAudio(def.file, def.vol, def.loop);
        const targetVol = def.vol;

        _current = trackId;

        if (_trackA && !_trackA.paused) {
          // Crossfade : fade out A, fade in B
          const oldA = _trackA;
          _trackB = newAudio;
          _trackB.play().catch(() => {});
          _fade(_trackB, 0, targetVol, FADE_DURATION);
          _fade(oldA, oldA.volume, 0, FADE_DURATION, () => {
            oldA.pause();
            oldA.src = '';
            _trackA = _trackB;
            _trackB = null;
          });
        } else {
          // Pas de piste active — démarre directement avec fade in
          if (_trackA) { _trackA.pause(); _trackA.src = ''; }
          _trackA = newAudio;
          _trackA.play().catch(() => {});
          _fade(_trackA, 0, targetVol, FADE_DURATION);
        }
      },

      /** Arrête la musique avec fade out. */
      stop() {
        if (_trackA) {
          const old = _trackA;
          _trackA = null;
          _current = null;
          _fade(old, old.volume, 0, FADE_DURATION / 2, () => {
            old.pause(); old.src = '';
          });
        }
      },

      /** Appelé lors du changement de zone ouverte ou d'onglet actif. */
      updateFromContext() {
        if (!_isEnabled()) { this.stop(); return; }

        // Priorité 0 : jukebox manuel
        if (state?.settings?.jukeboxTrack) {
          this.play(state.settings.jukeboxTrack);
          return;
        }

        // Priorité : première zone ouverte qui a une musique définie
        for (const zId of (state.openZoneOrder || [])) {
          const zone = ZONE_BY_ID[zId];
          if (zone?.music) { this.play(zone.music); return; }
        }
        // Fallback : musique de l'onglet actif
        if (globalThis.activeTab === 'tabGang' || globalThis.activeTab === 'tabZones') {
          this.play('base');
        } else {
          // Pas de zones ouvertes et onglet neutre → silence progressif
          this.stop();
        }
      },

      /** Volume global 0–1 */
      setVolume(v) {
        if (_trackA) _setVol(_trackA, Math.max(0, Math.min(1, v)) * (parseFloat(_trackA.dataset.targetVol) || 0.5));
      },

      get current() { return _current; },
    };
  })();

  /**
   * JinglePlayer — joue des courts extraits audio (ME) en one-shot.
   * Ne bloque pas la musique de fond — les deux coexistent.
   */
  const JINGLES = {
    trainer_encounter: 'music/ME/VSTrainer_Intro.mp3',
    wild_encounter:    'music/ME/VSWildPoke_Intro.mp3',
    legend_encounter:  'music/ME/VSLegend_Intro.mp3',
    rival_encounter:   'music/ME/VSRival_Intro.mp3',
    youngster:         'music/ME/Encounter_Youngster.mp3',
    mystery_gift:      'music/BGM/MysteryGift.mp3',
    low_hp:            'music/ME/lowhp.mp3',
    slots_win:         'music/ME/SlotsWin.mp3',
    slots_big:         'music/ME/SlotsBigWin.mp3',
  };

  const JinglePlayer = (() => {
    let _current = null;
    function _enabled() { return state?.settings?.musicEnabled === true; }

    return {
      play(key) {
        if (!_enabled()) return;
        const src = JINGLES[key];
        if (!src) return;
        if (_current) { _current.pause(); _current = null; }
        const a = new Audio(src);
        a.volume = 0.7;
        a.play().catch(() => {});
        _current = a;
        a.addEventListener('ended', () => { _current = null; });
      },
      stop() { if (_current) { _current.pause(); _current = null; } },
    };
  })();

  /**
   * SE (Sound Effects) — sons d'attaque et événements gameplay.
   * Utilise Audio HTML plutôt que Web Audio pour les fichiers complexes.
   */
  const SE_SOUNDS = {
    buy:        'music/SE/Charm.mp3',
    level_up:   'music/SE/BW2Summary.mp3',
    slash:      'music/SE/Slash.mp3',
    metronome:  'music/SE/Metronome.mp3',
    explosion:  'music/SE/Explosion.mp3',
    protect:    'music/SE/Protect.mp3',
    flash:      'music/SE/Flash.mp3',
  };

  function playSE(key, vol = 0.6) {
    if (state?.settings?.sfxEnabled === false) return;
    const src = SE_SOUNDS[key];
    if (!src) return;
    const a = new Audio(src);
    a.volume = vol;
    a.play().catch(() => {});
  }

  // Export constants and players to the global scope.
  Object.assign(globalThis, {
    MUSIC_TRACKS,
    MusicPlayer,
    JINGLES,
    JinglePlayer,
    SE_SOUNDS,
    playSE,
  });
})();