import {CommandHandler, ICommandHandler} from "@nestjs/cqrs";
import {StartGameCommand} from "../../domain/commands/start-game.command";
import {RoomRepository} from "../../domain/repositories/room.repository";
import {GameSessionRepository} from "../../domain/repositories/game-session.repository";

@CommandHandler(StartGameCommand)
export class StartGameCommandHandler implements ICommandHandler<StartGameCommand> {
    private roomRepository: RoomRepository;
    private gameSessionRepository: GameSessionRepository;

    constructor() {
    }

    async execute(command: StartGameCommand): Promise<void> {

        const room = await this.roomRepository.findOneById(command.roomId);

        const gameSession = room.startGame(
            command.creator,
            command.seats,
            command.wordPackIds,
            command.gameSessionId
        );

        await this.roomRepository.save(room);

        await this.gameSessionRepository.save(gameSession);
    }
}
