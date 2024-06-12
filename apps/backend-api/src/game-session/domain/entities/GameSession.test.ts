import {GameSession, GameSessionStatus} from "../../../../src/game-session/domain/entities/GameSession";
import {Room} from "../../../../src/room/domain/aggregateRoots/Room";
import {RoomId} from "../../../room/domain/value-objects/RoomId";
import {UserId} from "../../../room/domain/value-objects/UserId";
import {UserName} from "../../../room/domain/value-objects/UserName";
import {Users} from "../../../../src/room/domain/entities/Users";
import {User} from "../../../../src/room/domain/entities/User";
import {UserLastContactedAt} from "../../../room/domain/value-objects/userLastContactedAt";
import {WordPackId} from "../../../room/domain/value-objects/WordPackId";
import {GameSessionId} from "../../../room/domain/value-objects/GameSessionId";
import {GameSessionCreatedEvent} from "../../../../src/game-session/domain/events/game-session-created.event";

describe('GameSession', () => {
    it('should be defined', () => {
        expect(true).toBeDefined();
    });

    it('should create a new game session', () => {

        // Arrange
        const hostUserId = UserId.random();
        const room = new Room({
            id: RoomId.random(),
            host: hostUserId,
            users: new Users([
                new User({
                    id: hostUserId,
                    name: UserName.random(),
                    lastContactedAt: UserLastContactedAt.create(new Date())
                }),
            ]),
            createdAt: new Date(),
            updatedAt: new Date()
        })
        const creator = hostUserId;
        const wordPackIds = [WordPackId.random(), WordPackId.random()];
        const id = GameSessionId.random();
        const currentDate = new Date();

        // Act
        const gameSession = GameSession.create(room, creator, wordPackIds, id, currentDate);

        // Assert
        expect(gameSession).toBeDefined();

        expect(gameSession.getUncommittedEvents()).toMatchObject([{
            aggregateId: id.value,
            roomId: room.id.value,
            seats: [
                {
                    index: 0,
                    playerName: 'random',
                    playerUserId: creator.value
                }
            ],
            wordPackIds: wordPackIds.map(wordPackId => wordPackId.value),
            status: GameSessionStatus.CREATED,
            occurredOn: currentDate,
            eventName: GameSessionCreatedEvent.EVENT_NAME
        }]);
    });
});
