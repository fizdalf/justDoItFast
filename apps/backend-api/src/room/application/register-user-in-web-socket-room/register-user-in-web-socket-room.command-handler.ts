import {CommandHandler, ICommandHandler} from "@nestjs/cqrs";
import {RegisterUserInWebsocketCommand} from "../../domain/commands/register-user-in-web-socket-room.command";
import {Inject, Injectable} from "@nestjs/common";
import {RoomRepository} from "../../domain/repositories/room.repository";

@Injectable()
@CommandHandler(RegisterUserInWebsocketCommand)
export class RegisterUserInWebSocketRoomCommandHandler implements ICommandHandler<RegisterUserInWebsocketCommand> {

    constructor(@Inject(RoomRepository) private readonly roomRepository: RoomRepository) {
    }

    async execute(command: RegisterUserInWebsocketCommand) {

        const room = await this.roomRepository.findOneById(command.roomId);
        const client = command.client;
        client.join(command.roomId.value);
    }
}