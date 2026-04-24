Data extraction pack for PokéGang

Files included:
- pokedex-desc.js
- zones-visuals-data.js
- missions-data.js
- trainers-data.js

Suggested integration in app.js:

import { POKEDEX_DESC } from "./data/pokedex-desc.js";
import { ZONE_BGS, COSMETIC_BGS } from "./data/zones-visuals-data.js";
import { MISSIONS, HOURLY_QUEST_POOL } from "./data/missions-data.js";
import { TRAINER_TYPES } from "./data/trainers-data.js";

Then comment/remove the original const blocks from app.js once the imports are in place.
