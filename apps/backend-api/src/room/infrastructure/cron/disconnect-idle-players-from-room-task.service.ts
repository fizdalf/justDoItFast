import {ConsoleLogger, Injectable} from '@nestjs/common';
import {Interval} from '@nestjs/schedule';
import {CommandBus} from '@nestjs/cqrs';
import {
    RequestIdlePlayersRemovalFromRoomCommand
} from '../../domain/commands/request-idle-players-removal-from-room.command';

@Injectable()
export class DisconnectIdlePlayersFromRoomTask {

    constructor(private readonly commandBus: CommandBus, private readonly logger: ConsoleLogger) {
    }

    @Interval(30000)
    async handleCron() {
        this.logger.log('Disconnecting idle players from rooms', 'DisconnectIdlePlayersFromRoomTask');
        await this.commandBus.execute(new RequestIdlePlayersRemovalFromRoomCommand());
    }
}
