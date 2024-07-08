import {ComponentFixture, TestBed} from '@angular/core/testing';
import {CreateRoomPageComponent} from './create-room-page.component';
import {provideHttpClient} from "@angular/common/http";
import {AuthenticationService} from "../../services/authentication/authentication.service";

describe('SelectIconPageComponent', () => {
    let component: CreateRoomPageComponent;
    let fixture: ComponentFixture<CreateRoomPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CreateRoomPageComponent,],
            providers: [
                provideHttpClient(),
                {
                    provide: AuthenticationService,
                    useValue: {
                        createRoom: jest.fn()
                    }
                }
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CreateRoomPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
