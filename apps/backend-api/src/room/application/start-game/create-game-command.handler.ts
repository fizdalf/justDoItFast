import {CommandHandler, ICommandHandler} from "@nestjs/cqrs";
import {CreateGameCommand} from "../../domain/commands/create-game.command";
import {RoomRepository} from "../../domain/repositories/room.repository";
import {GameSessionRepository} from "../../domain/repositories/game-session.repository";
import {GameSession} from "../../../game-session/domain/entities/GameSession";
import {DateTimeService} from "../../../shared/domain/date-time.service";
import {Inject} from "@nestjs/common";

@CommandHandler(CreateGameCommand)
export class CreateGameCommandHandler implements ICommandHandler<CreateGameCommand> {
    constructor(
        @Inject(RoomRepository) private readonly roomRepository: RoomRepository,
        @Inject(GameSessionRepository) private readonly gameSessionRepository: GameSessionRepository,
        @Inject(DateTimeService) private readonly dateTimeService: DateTimeService
    ) {
    }


    async execute(command: CreateGameCommand): Promise<void> {
        const room = await this.roomRepository.findOneById(command.roomId);
        const gameSession = GameSession.create(room, command.creator, command.wordPackIds, command.gameSessionId, this.dateTimeService.now());
        await this.gameSessionRepository.save(gameSession);
    }
}
