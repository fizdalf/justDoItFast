import {GameSession} from '../../../services/game-session/session.service';
import {SessionId} from '../../../services/game-session/SessionId';
import {GameSessionRepository} from '../../../domain/GameSessionRepository';
import {Injectable} from '@angular/core';

@Injectable({providedIn: 'root'})
export class GameSessionIndexedDBRepository implements GameSessionRepository {
    private readonly db: Promise<IDBDatabase>;

    constructor() {

        this.db = new Promise((resolve, reject) => {
            const request = indexedDB.open('just-guess-it', 1);
            request.onerror = (event) => {
                reject(request.error);
            }
            request.onsuccess = (event) => {
                resolve(request.result);
            }
            request.onupgradeneeded = (event) => {
                const db = request.result;
                const objectStore = db.createObjectStore('game-session');
            }
        });
    }

    async ofId(id: SessionId) {
        const db = await this.db;
        const transaction = db.transaction('game-session');
        const objectStore = transaction.objectStore('game-session');
        const request = objectStore.get(id.value);

        return new Promise<GameSession>((resolve, reject) => {
            request.onerror = (event) => {
                reject(request.error);
            }
            request.onsuccess = (event) => {
                resolve(request.result as GameSession);
            }
        });
    }

    async save(session: GameSession) {
        const db = await this.db;
        const transaction = db.transaction('game-session', 'readwrite');
        const objectStore = transaction.objectStore('game-session');
        const request = objectStore.put(session, session.id.value);

        return new Promise<void>((resolve, reject) => {
            request.onerror = (event) => {
                reject(request.error);
            }
            request.onsuccess = (event) => {
                resolve();
            }
        });
    }
}


