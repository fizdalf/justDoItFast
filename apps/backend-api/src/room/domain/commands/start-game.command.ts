import {ICommand} from "@nestjs/cqrs";
import {RoomId} from "../value-objects/RoomId";
import {UserId} from "../value-objects/UserId";
import {WordPackId} from "../value-objects/WordPackId";
import {GameSessionId} from "../value-objects/GameSessionId";

interface ConstructorParams {
    roomId: RoomId;
    creator: UserId;
    seats: UserId[];
    wordPackIds: WordPackId[];
    gameSessionId: GameSessionId;
}

export class StartGameCommand implements ICommand {
    public readonly roomId: RoomId;
    public readonly creator: UserId;
    public readonly seats: UserId[];
    public readonly wordPackIds: WordPackId[];
    public readonly gameSessionId: GameSessionId;

    constructor(
        {roomId, creator, seats, wordPackIds, gameSessionId}: ConstructorParams
    ) {
        this.gameSessionId = gameSessionId;
        this.wordPackIds = wordPackIds;
        this.seats = seats;
        this.creator = creator;
        this.roomId = roomId;
    }
}
