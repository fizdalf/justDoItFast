import {Controller, Post, Req, UseGuards} from '@nestjs/common';
import {CommandBus} from '@nestjs/cqrs';
import {RoomId} from '../../../../domain/value-objects/RoomId';
import {UserId} from '../../../../domain/value-objects/UserId';
import {CreateGameCommand} from "../../../../domain/commands/create-game.command";
import {RoomConnectedGuard} from "../../guards/room-connected-guard.service";
import {RoomToken} from "../../../../domain/value-objects/RoomToken";
import {GameSessionId} from "../../../../domain/value-objects/GameSessionId";

export abstract class CreateGameRequestParams {

}

@UseGuards(RoomConnectedGuard)
@Controller('room/create-game')
export class CreateGameController {

    constructor(private readonly commandBus: CommandBus,) {
    }

    @Post()
    async createGame(@Req() req: { decodedData: RoomToken }) {
        const decodedData = req.decodedData;
        await this.commandBus.execute(
            new CreateGameCommand({
                roomId: RoomId.fromValue(decodedData.roomId),
                creator: UserId.fromValue(decodedData.playerId),
                wordPackIds: [],
                gameSessionId: GameSessionId.random()
            })
        );

        return {
            success: true,
        };
    }
}


