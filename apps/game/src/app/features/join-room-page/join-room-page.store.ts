import {Injectable} from '@angular/core';
import {ComponentStore} from '@ngrx/component-store';
import {RoomService} from '../../services/room/roomService';
import {Observable, switchMap, tap} from 'rxjs';
import {Router} from '@angular/router';

import {RoomPreviewDto} from '@org/core/room/dto/room-preview.dto';

interface JoinRoomPageState {
    roomId: string | undefined;
    userName: string | undefined;
    roomPreview: RoomPreviewDto | undefined;
}

@Injectable()
export class JoinRoomPageStore extends ComponentStore<JoinRoomPageState> {
    private readonly session$ = this.select((state) => state.roomPreview);

    //// Selectors ////
    public readonly vm$: Observable<{ roomPreview: RoomPreviewDto | undefined }> = this.select(
        this.session$,
        (roomPreview: RoomPreviewDto | undefined) => {
            return {
                roomPreview: roomPreview,
            };
        });
    private setSession = this.updater((state, session: RoomPreviewDto) => {
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
            userName: undefined,
        });
    }

}
