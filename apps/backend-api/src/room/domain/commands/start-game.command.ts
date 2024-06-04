import {ICommand} from "@nestjs/cqrs";
import {RoomId} from "../valueObjects/RoomId";
import {UserId} from "../valueObjects/UserId";
import {WordPackId} from "../valueObjects/WordPackId";
import {GameSessionId} from "../valueObjects/GameSessionId";

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
