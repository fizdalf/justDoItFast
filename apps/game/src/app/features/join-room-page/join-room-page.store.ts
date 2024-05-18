import {Injectable} from '@angular/core';
import {ComponentStore} from '@ngrx/component-store';
import {RoomService} from '../../services/room/roomService';
import {Observable, switchMap, tap} from 'rxjs';
import {Router} from '@angular/router';

import {RoomPreview} from '@org/core/room/dto/roomPreview';

interface JoinRoomPageState {
    roomId: string | undefined;
    playerName: string | undefined;
    roomPreview: RoomPreview | undefined;
}

@Injectable()
export class JoinRoomPageStore extends ComponentStore<JoinRoomPageState> {
    private readonly session$ = this.select((state) => state.roomPreview);

    //// Selectors ////
    public readonly vm$: Observable<{ roomPreview: RoomPreview | undefined }> = this.select(
        this.session$,
        (roomPreview: RoomPreview | undefined) => {
            return {
                roomPreview: roomPreview,
            };
        });
    private setSession = this.updater((state, session: RoomPreview) => {
        return {
            ...state,
            roomPreview: session,
        };

    })
    // //// Updaters ////
    // public readonly setSelectedIcon = this.effect<any>((selectedIcon$) => {
    //     return selectedIcon$.pipe(
    //         combineLatestWith(this.room$),
    //         switchMap(async ([selectedIcon, room]) => {
    //             await this.sessionService.joinRoom(room.id, selectedIcon.name);
    //             this.router.navigate(['/', 'room-join-waiting-room', room.id]);
    //         }),
    //     );
    // });
    //// Effects ////
    public readonly loadSession = this.effect<string>((sessionId$: Observable<string>) => {
        return sessionId$.pipe(
            switchMap((sessionId) => this.sessionService.getRoomPreview(sessionId)),
            tap((session) => this.setSession(session))
        );
    });

    constructor(
        private sessionService: RoomService,
        private router: Router
    ) {
        super({
            roomId: undefined,
            roomPreview: undefined,
            playerName: undefined,
        });
    }

}
