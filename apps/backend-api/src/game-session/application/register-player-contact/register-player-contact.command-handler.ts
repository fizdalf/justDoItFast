import {RegisterPlayerContactCommand} from '../../domain/commands/register-player-contact.command';
import {CommandHandler, ICommandHandler} from '@nestjs/cqrs';
import {GameSessionRepository} from '../../domain/repositories/game-session.repository';
import {Inject} from '@nestjs/common';
import {GameSessionId} from '../../domain/valueObjects/GameSessionId';
import {PlayerId} from '../../domain/valueObjects/PlayerId';
import {DateTimeService} from '../../../shared/domain/date-time.service';

@CommandHandler(RegisterPlayerContactCommand)
export class RegisterPlayerContactCommandHandler implements ICommandHandler<RegisterPlayerContactCommand> {

    constructor(
        @Inject(GameSessionRepository) private readonly gameSessionRepository: GameSessionRepository,
        @Inject(DateTimeService) private readonly dateTimeService: DateTimeService
    ) {
    }

    async execute(command: RegisterPlayerContactCommand): Promise<void> {
        const gameSession = await this.gameSessionRepository.findOneById(GameSessionId.fromValue(command.sessionId));
        gameSession.registerPlayerContact(PlayerId.fromValue(command.playerId), this.dateTimeService.now());
        await this.gameSessionRepository.save(gameSession);
    }
}
