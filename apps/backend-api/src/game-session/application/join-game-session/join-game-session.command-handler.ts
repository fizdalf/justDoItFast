import {CommandHandler, EventBus, ICommandHandler, IEventBus,} from '@nestjs/cqrs';
import {JoinGameSessionCommand} from '../../domain/commands/join-game-session.command';
import {GameSessionRepository} from '../../domain/repositories/game-session.repository';
import {Player} from '../../domain/entities/Player';
import {Inject} from '@nestjs/common';
import {GameSessionId} from '../../domain/valueObjects/GameSessionId';
import {PlayerId} from '../../domain/valueObjects/PlayerId';
import {PlayerName} from '../../domain/valueObjects/PlayerName';
import {PlayerLastContactedAt} from '../../domain/valueObjects/playerLastContactedAt';


@CommandHandler(JoinGameSessionCommand)
export class JoinGameSessionCommandHandler implements ICommandHandler<JoinGameSessionCommand> {
    constructor(
        @Inject(GameSessionRepository) private readonly gameSessionRepository: GameSessionRepository,
        @Inject(EventBus) private eventBus: IEventBus
    ) {
    }

    async execute(command: JoinGameSessionCommand) {
        const gameSession = await this.gameSessionRepository.findOneById(GameSessionId.fromValue(command.sessionId));

        const player = new Player({
            id: PlayerId.fromValue(command.playerId),
            name: PlayerName.fromValue(command.playerName),
            lastContactedAt: PlayerLastContactedAt.create(new Date())
        });
        gameSession.addPlayer(player);

        await this.gameSessionRepository.save(gameSession);
        this.eventBus.publishAll(gameSession.getUncommittedEvents());
    }
}
