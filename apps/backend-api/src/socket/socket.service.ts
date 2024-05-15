import {Server} from 'socket.io';


export class SocketService {
    private server: Server;
    constructor() {
    }

    init(server: Server) {
        this.server = server;
    }



}
