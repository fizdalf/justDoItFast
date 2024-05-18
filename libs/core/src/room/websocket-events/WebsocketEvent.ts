export abstract class WebsocketEvent<T> {
    protected static _eventName: string;
    static eventName(): string {
        return this._eventName;
    }
    abstract payload(): T;
}
