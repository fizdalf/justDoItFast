import {CreateRoomCommandHandler} from './create-room-command.handler';
import {RoomId} from '../../domain/valueObjects/RoomId';
import {User} from '../../domain/entities/User';
import {UserId} from '../../domain/valueObjects/UserId';
import {Room} from '../../domain/aggregateRoots/Room';
import {UserName} from '../../domain/valueObjects/UserName';
import {UserLastContactedAt} from '../../domain/valueObjects/userLastContactedAt';

describe('CreateRoomCommandHandler', () => {
    it('should be defined', () => {
        expect(CreateRoomCommandHandler).toBeDefined();
    });

    it('should create a new room', async () => {

            const host = new User({
                name: UserName.fromValue('pepe'),
                id: UserId.random(),
                lastContactedAt: new UserLastContactedAt(new Date())
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
            expect(savedRoom._id).toEqual(roomId);
            expect(savedRoom._host).toEqual(host.id);
        }
    );
});



