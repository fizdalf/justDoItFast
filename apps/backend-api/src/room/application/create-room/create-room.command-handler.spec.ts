import {CreateRoomCommandHandler} from './create-room-command.handler';
import {RoomId} from '../../domain/valueObjects/RoomId';
import {Player} from '../../domain/entities/Player';
import {PlayerId} from '../../domain/valueObjects/PlayerId';
import {Room} from '../../domain/aggregateRoots/Room';
import {PlayerName} from '../../domain/valueObjects/PlayerName';
import {PlayerLastContactedAt} from '../../domain/valueObjects/playerLastContactedAt';

describe('CreateRoomCommandHandler', () => {
    it('should be defined', () => {
        expect(CreateRoomCommandHandler).toBeDefined();
    });

    it('should create a new room', async () => {

            const host = new Player({
                name: PlayerName.fromValue('pepe'),
                id: PlayerId.random(),
                lastContactedAt: new PlayerLastContactedAt(new Date())
            });
            const roomId = RoomId.random();
            const command = {
                params: {
                    host,
                    roomId,
                },
            };
            const repository = {
                save: jest.fn(),
            };

            const createRoomCommandHandler = new CreateRoomCommandHandler(repository as any);

            // When
            await createRoomCommandHandler.execute(command);

            // Then
            expect(repository.save).toHaveBeenCalledWith(expect.any(Room));
            const savedRoom = repository.save.mock.calls[0][0];
            expect(savedRoom.id).toEqual(roomId);
            expect(savedRoom.host).toEqual(host.id);
        }
    );
});



