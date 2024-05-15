import {Injectable} from '@nestjs/common';
import {Interval} from '@nestjs/schedule';
import {CommandBus} from '@nestjs/cqrs';
import {
    RequestIdlePlayersRemovalFromGameSessionsCommand
} from '../../domain/commands/request-idle-players-removal-from-game-sessions.command';

@Injectable()
export class DisconnectIdlePlayersFromGameSessionTask {

    constructor(private readonly commandBus: CommandBus) {
    }

    @Interval(60000)
    async handleCron() {
        this.commandBus.execute(new RequestIdlePlayersRemovalFromGameSessionsCommand());
    }
}
