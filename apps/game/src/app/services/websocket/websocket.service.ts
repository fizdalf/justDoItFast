import {io, Socket} from 'socket.io-client';
import {environment} from '../../../environments/environment';
import {DefaultEventsMap} from 'socket.io/dist/typed-events';

export class WebsocketService {

    connectedSocket: Promise<Socket<DefaultEventsMap, DefaultEventsMap>>

    constructor() {
        const socket: Socket<DefaultEventsMap, DefaultEventsMap> = io(environment.socketUrl);


        this.connectedSocket = new Promise((resolve, reject) => {
            socket.on('connect', () => {
                console.log('connected');

                socket.on('room-event', (data) => {
                    console.log('room-event', data);
                });

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

    async emit(event: string, data: any) {
        const socket = await this.connectedSocket;
        socket.emit(event, data);
    }

    async on(event: string, callback: (data: any) => void) {
        const socket = await this.connectedSocket;
        socket.on(event, callback);
    }
}
