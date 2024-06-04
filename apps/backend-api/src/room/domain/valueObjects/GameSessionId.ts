import {UuidValueObject} from "@org/core/shared/domain/UuidValueObject";

export class GameSessionId extends UuidValueObject {

    static random(): GameSessionId {
        return new GameSessionId(this.randomUuid());
    }

    static fromValue(id: string) {
        return new GameSessionId(id);
    }
}
