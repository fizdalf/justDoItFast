import {common} from './common.js';
import {errors} from './errors.js';
import {home} from './home.js';
import {lobby} from './lobby.js';
import {game} from './game.js';
import {admin} from './admin.js';

// El español es el idioma de referencia: su forma define el tipo `Messages`
// y el resto de idiomas deben tener exactamente las mismas claves.
export const es = { common, errors, home, lobby, game, admin };

export type Messages = typeof es;
