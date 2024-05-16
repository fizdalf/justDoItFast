import {ConsoleLogger, Injectable} from '@nestjs/common';
import {Interval} from '@nestjs/schedule';
import {CommandBus} from '@nestjs/cqrs';
import {
    RequestIdlePlayersRemovalFromGameSessionsCommand
} from '../../domain/commands/request-idle-players-removal-from-game-sessions.command';

@Injectable()
export class DisconnectIdlePlayersFromGameSessionTask {

    constructor(private readonly commandBus: CommandBus, private readonly logger: ConsoleLogger) {
    }

    @Interval(30000)
    async handleCron() {
        this.logger.log('Disconnecting idle players from game sessions', 'DisconnectIdlePlayersFromGameSessionTask');
        await this.commandBus.execute(new RequestIdlePlayersRemovalFromGameSessionsCommand());
    }
}
