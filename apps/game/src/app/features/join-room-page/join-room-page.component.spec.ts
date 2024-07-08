import {ComponentFixture, TestBed} from '@angular/core/testing';
import {JoinRoomPageComponent} from './join-room-page.component';
import {provideHttpClient} from "@angular/common/http";
import {AuthenticationService} from "../../services/authentication/authentication.service";

describe('JoinSessionPageComponent', () => {
    let component: JoinRoomPageComponent;
    let fixture: ComponentFixture<JoinRoomPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [JoinRoomPageComponent],
            providers: [
                provideHttpClient(),
                {
                    provide: AuthenticationService,
                    useValue: {
                        joinRoom: jest.fn()
                    }
                }
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(JoinRoomPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
