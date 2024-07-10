import {ICommand} from "@nestjs/cqrs";
import {RoomId} from "../value-objects/RoomId";
import {UserId} from "../value-objects/UserId";
import {WordPackId} from "../value-objects/WordPackId";
import {GameSessionId} from "../value-objects/GameSessionId";

interface ConstructorParams {
    roomId: RoomId;
    creator: UserId;
    wordPackIds: WordPackId[];
    gameSessionId: GameSessionId;
}

export class CreateGameCommand implements ICommand {
    public readonly roomId: RoomId;
    public readonly creator: UserId;
    public readonly wordPackIds: WordPackId[];
    public readonly gameSessionId: GameSessionId;

    constructor(
        {roomId, creator, wordPackIds, gameSessionId}: ConstructorParams
    ) {
        this.gameSessionId = gameSessionId;
        this.wordPackIds = wordPackIds;
        this.creator = creator;
        this.roomId = roomId;
    }
}
