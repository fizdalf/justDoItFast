import {io, Socket} from 'socket.io-client';
import {environment} from '../../../environments/environment';
import {DefaultEventsMap} from 'socket.io/dist/typed-events';
import {Observable} from 'rxjs';

export class WebsocketService {

    private socket: Socket<DefaultEventsMap, DefaultEventsMap>;

    constructor() {
        this.socket = io(environment.socketUrl);

    }

    emit<Payload>(event: string, data: Payload) {
        this.socket.emit(event, data);
    }

    async emitWithAcknowledge<Payload, Response>(event: string, data: Payload): Promise<Response> {
        return new Promise<Response>((resolve, reject) => {
            this.socket.emit(event, data, (response: Response) => {
                resolve(response);
            });
        });
    }

    on<Payload>(eventName: string): Observable<Payload> {
        return new Observable<Payload>(subscriber => {
            const listener = (data: Payload, ack: any) => {
                subscriber.next(data);
            };
            this.socket.on(eventName, listener);

            return () => {
                this.socket.off(eventName, listener);
            };
        });
    }

    onWithAcknowledge<Payload, Response>(eventName: string): Observable<[Payload, (response: Response) => void]> {
        return new Observable<[Payload, (response: Response) => void]>(subscriber => {
            const listener = (data: Payload, ack: (response: Response) => void) => {
                subscriber.next([data, ack]);
            };
            this.socket.on(eventName, listener);

            return () => {
                this.socket.off(eventName, listener);
            };
        });
    }
}
