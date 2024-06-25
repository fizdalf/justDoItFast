export class PlayerAlreadyInGameError extends Error {
    constructor() {
        super('Player already in game');
    }
}
