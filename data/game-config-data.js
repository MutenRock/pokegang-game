/* Game config constants extracted from app.js */

const NATURES = {
  hardy:   { fr:'Hardi',    en:'Hardy',   atk:1,   def:1,   spd:1   },
  brave:   { fr:'Brave',    en:'Brave',   atk:1.1, def:1,   spd:0.9 },
  timid:   { fr:'Timide',   en:'Timid',   atk:0.9, def:1,   spd:1.1 },
  bold:    { fr:'Assuré',   en:'Bold',    atk:0.9, def:1.1, spd:1   },
  jolly:   { fr:'Jovial',   en:'Jolly',   atk:1,   def:0.9, spd:1.1 },
  adamant: { fr:'Rigide',   en:'Adamant', atk:1.1, def:1,   spd:0.9 },
  calm:    { fr:'Calme',    en:'Calm',    atk:1,   def:1.1, spd:0.9 },
  modest:  { fr:'Modeste',  en:'Modest',  atk:0.9, def:1,   spd:1.1 },
  careful: { fr:'Prudent',  en:'Careful', atk:1,   def:1.1, spd:0.9 },
  naive:   { fr:'Naïf',     en:'Naive',   atk:1,   def:0.9, spd:1.1 },
};
const NATURE_KEYS = Object.keys(NATURES);

// ── Boss sprites to pick from ─────────────────────────────────
const BOSS_SPRITES = [
  // Kanto Gym Leaders
  'brock','misty','ltsurge','erika','koga','sabrina','blaine','giovanni',
  // Kanto Elite Four + Rivals
  'lorelei','bruno','agatha','lance','blue','red','silver','oak',
  // Team Rocket
  'archer','ariana','proton','scientist','rocketexecutive','teamrocket',
  // Johto Gym Leaders
  'falkner','bugsy','whitney','morty','chuck','jasmine','pryce','clair',
  // Johto Elite Four
  'will','karen',
  // Hoenn Gym Leaders
  'roxanne','brawly','wattson','flannery','norman','winona','tate','liza','juan',
  // Hoenn Elite Four + Champion
  'sidney','phoebe','glacia','drake','steven','wallace',
  // Sinnoh Gym Leaders
  'roark','gardenia','maylene','fantina','byron','candice','volkner',
  // Sinnoh Elite Four + Champion
  'aaron','bertha','flint','lucian','cynthia',
  // Unova
  'n','ghetsis','iris','drayden','cheren','bianca','colress',
];

// ── Agent name pools ──────────────────────────────────────────
const AGENT_NAMES_M = ['Marco','Léo','Jin','Viktor','Dante','Axel','Zane','Kai','Nero','Blaze','Rex','Ash','Saul','Ren','Hugo'];
const AGENT_NAMES_F = ['Mira','Luna','Jade','Nova','Aria','Ivy','Nyx','Zara','Kira','Elsa','Rosa','Saki','Lena','Yuki','Tess'];
const AGENT_SPRITES = [
  // Team Rocket
  'rocketgrunt','rocketgruntf','scientist','archer','ariana','proton',
  // Common trainers
  'camper','picnicker','acetrainer','acetrainerf',
  'youngster','lass','bugcatcher','hiker','fisherman','beauty','blackbelt',
  'swimmer','swimmerf','psychic','psychicf','gentleman','gambler',
  'juggler','burglar','channeler','birdkeeper','cueball','tamer','rocker',
  // Kanto/Johto misc
  'cooltrainer','cooltrainerf','pokefan','pokefanf',
  // Forces de l'ordre
  'pokemonranger','pokemonrangerf','policeman',
];
const AGENT_PERSONALITIES = ['loyal','nervous','reckless','calm','cunning','lazy','fierce','quiet','greedy','brave','curious','stubborn'];

const TITLE_REQUIREMENTS = {
  lieutenant: { level: 50, combatsWon: 25 },
  captain:    { level: 75, combatsWon: 200 },
};
const TITLE_BONUSES = { grunt: 0, lieutenant: 0.15, captain: 0.30 };

export { NATURES, NATURE_KEYS, BOSS_SPRITES, AGENT_NAMES_M, AGENT_NAMES_F, AGENT_SPRITES, AGENT_PERSONALITIES, TITLE_REQUIREMENTS, TITLE_BONUSES };
