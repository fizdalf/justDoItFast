import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionJoinWaitingRoomPageComponent } from './session-join-waiting-room-page.component';

describe('SessionJoinWaitingRoomPageComponent', () => {
  let component: SessionJoinWaitingRoomPageComponent;
  let fixture: ComponentFixture<SessionJoinWaitingRoomPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionJoinWaitingRoomPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionJoinWaitingRoomPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
