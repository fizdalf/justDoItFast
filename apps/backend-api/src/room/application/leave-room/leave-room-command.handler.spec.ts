import {LeaveRoomCommandHandler} from "./leave-room-command.handler";
import {RoomId} from "../../domain/value-objects/RoomId";
import {UserId} from "../../domain/value-objects/UserId";
import {UserMother} from "../../../../test/room/domain/entities/user.mother";
import {RoomMother} from "../../../../test/room/domain/aggregateRoots/room.mother";
import {RoomRepository} from "../../domain/repositories/room.repository";
import {Room} from "../../domain/aggregateRoots/Room";
import {RoomUserLeftEvent} from "../../domain/events/room-user-left.event";


const ROOM_ID = RoomId.fromValue('6ecd63c4-283e-4478-a5c6-689fed914ca6');
const LEAVER_USER_ID = new UserId('b96db6c1-d5d9-44ad-9107-274e747d2d3c');
describe('LeaveRoomCommandHandler', () => {
        it('should be defined', () => {
            expect(LeaveRoomCommandHandler).toBeDefined();
        });


        it('should make a user leave a room', async () => {
            // Arrange
            const room = aRoomWithLeavingUser();
            const roomRepository = new FakeRoomRepository([room]);
            const handler = new LeaveRoomCommandHandler(roomRepository);

            // Act
            await handler.execute({roomId: ROOM_ID, userId: LEAVER_USER_ID});

            // Assert
            const isRoomSaved = roomRepository.savedRooms.has(ROOM_ID.value);
            expect(isRoomSaved).toBe(true);
            verifyUserLeftEvent(room);

        });

        function aRoomWithLeavingUser() {
            const host = UserMother.create();
            return RoomMother.create({
                    id: ROOM_ID,
                    host: host.id,
                    createdAt: new Date(),
                    users: [
                        host,
                        UserMother.create({id: LEAVER_USER_ID})
                    ]
                }
            );
        }

        function verifyUserLeftEvent(room: Room) {
            const events = room.getUncommittedEvents();
            expect(events).toHaveLength(1);
            const event = events[0];
            expect(event).toBeInstanceOf(RoomUserLeftEvent);
            const roomUserLeftEvent = event as RoomUserLeftEvent;
            expect(roomUserLeftEvent.aggregateId).toEqual(ROOM_ID.value);
            expect(roomUserLeftEvent.userId).toEqual(LEAVER_USER_ID.value);
        }
    }
)
;


class FakeRoomRepository implements RoomRepository {
    public readonly rooms: Map<string, Room>;
    public readonly savedRooms: Map<any, any>;

    constructor(rooms: Room[]) {
        this.rooms = new Map(rooms.map(room => [room.id.value, room]));
        this.savedRooms = new Map();
    }


    async findOneById(id: RoomId): Promise<Room> {
        if (!this.rooms.has(id.value)) {
            throw new Error('Room not found');
        }
        return this.rooms.get(id.value);
    };

    async save(room: Room): Promise<void> {
        this.savedRooms.set(room.id.value, room);

    };

    async remove(id: RoomId): Promise<void> {
        this.rooms.delete(id.value);
    }

}
