import type {Messages} from '../es/index.js';
import {common} from './common.js';
import {errors} from './errors.js';
import {home} from './home.js';
import {lobby} from './lobby.js';
import {game} from './game.js';
import {admin} from './admin.js';

export const en: Messages = { common, errors, home, lobby, game, admin };
