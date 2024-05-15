import {io, Socket} from 'socket.io-client';
import {environment} from '../../../environments/environment';
import {DefaultEventsMap} from 'socket.io/dist/typed-events';
import {Observable, switchMap} from 'rxjs';
import {fromPromise} from 'rxjs/internal/observable/innerFrom';

export class WebsocketService {
    private listeners: { eventName: string, listener: (data: any) => void }[] = [];
    connectedSocket: Promise<Socket<DefaultEventsMap, DefaultEventsMap>>

    constructor() {
        const socket: Socket<DefaultEventsMap, DefaultEventsMap> = io(environment.socketUrl);


        this.connectedSocket = new Promise((resolve, reject) => {
            socket.on('connect', () => {
                resolve(socket);
            });
        });

        // socket.on('connect', () => {
        //     console.log('connected');
        //
        // });
        //
        // socket.on('events', function (data) {
        //     console.log('event', data);
        // });
        // socket.on('exception', function (data) {
        //     console.log('event', data);
        // });
        // socket.on('disconnect', function () {
        //     console.log('Disconnected');
        // });
    }

    async emit<Payload>(event: string, data: Payload) {
        const socket = await this.connectedSocket;
        socket.emit(event, data);
    }

    on<Payload>(eventName: string): Observable<Payload> {
        // we can store the listeners so that when socket is disconnected ..and connected again we can reattach the listeners


        return fromPromise(this.connectedSocket)
            .pipe(
                switchMap(socket => {
                        return new Observable<any>(subscriber => {
                            const listener = (data: Payload) => {
                                subscriber.next(data);
                            };
                            socket.on(eventName, listener);

                            // socket.on('disconnect', () => {
                            //     console.log(`on ${eventName} disconnected`);
                            //     subscriber.complete();
                            // })
                            return () => {
                                socket.off(eventName, listener);
                            };
                        })
                    }
                )
            );


    }

    private attachListeners(socket: Socket) {
        this.listeners.forEach(({eventName, listener}) => {
            socket.on(eventName, listener);
        });
        socket.on('connect', () => {
            this.attachListeners(socket);
        });
    }
}
