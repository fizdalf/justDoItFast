import {ComponentFixture, TestBed} from '@angular/core/testing';
import {RoomPageComponent} from './room-page.component';
import {provideZoneChangeDetection} from "@angular/core";
import {provideRouter} from "@angular/router";
import {RoomPageStore} from "./room-page.store";
import {provideHttpClient} from "@angular/common/http";
import {WebsocketService} from "../../services/websocket/websocket.service";
import {AuthenticationService} from "../../services/authentication/authentication.service";

describe('RoomPageComponent', () => {
    let component: RoomPageComponent;
    let fixture: ComponentFixture<RoomPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RoomPageComponent],
            providers: [
                provideZoneChangeDetection(),
                provideHttpClient(),
                provideRouter([]),
                {
                    provide: RoomPageStore,
                    useValue: {

                    }
                },
                {
                    provide: WebsocketService,
                    useValue: {}
                },
                {
                    provide: AuthenticationService,
                    useValue: {}
                }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(RoomPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
