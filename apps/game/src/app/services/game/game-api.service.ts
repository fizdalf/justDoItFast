import {GameService} from "./game.service";
import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {firstValueFrom} from "rxjs";
import {GameWaitingRoomDto} from "@org/core/game/dto/game-waiting-room.dto";
import {AuthenticationService} from "../authentication/authentication.service";

@Injectable({
    providedIn: 'root'
})
export class GameApiService implements GameService {
    constructor(private http: HttpClient, private authenticationService: AuthenticationService) {
    }

    async getGameWaitingRoom(): Promise<GameWaitingRoomDto> {
        return firstValueFrom(this.http.get<GameWaitingRoomDto>('/api/game', {
            headers: {
                Authorization: `Bearer ${sessionStorage.getItem('roomToken')}`
            }
        }));
    }

}