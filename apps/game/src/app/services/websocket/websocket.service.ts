import {io, Socket} from 'socket.io-client';
import {environment} from '../../../environments/environment';
import {DefaultEventsMap} from 'socket.io/dist/typed-events';
import {Observable, share} from 'rxjs';

export class WebsocketService {

    private socket: Socket<DefaultEventsMap, DefaultEventsMap>;
    private socket$: Observable<Socket<DefaultEventsMap, DefaultEventsMap>>;

    constructor() {
        this.socket = io(environment.socketUrl);

        this.socket$ = new Observable<Socket<DefaultEventsMap, DefaultEventsMap>>(subscriber => {
            this.socket.on('connect', () => {
                console.log('socket connected');
                subscriber.next(this.socket);
            });
            return () => {
                this.socket.disconnect();
            };
        }).pipe(share()); // Share the connection between multiple subscribers
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
            const listener = (data: Payload) => {
                subscriber.next(data);
            };
            this.socket.on(eventName, listener);

            return () => {
                this.socket.off(eventName, listener);
            };
        });
    }
}
