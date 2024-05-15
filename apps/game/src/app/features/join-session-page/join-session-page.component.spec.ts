import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JoinSessionPageComponent } from './join-session-page.component';

describe('JoinSessionPageComponent', () => {
  let component: JoinSessionPageComponent;
  let fixture: ComponentFixture<JoinSessionPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoinSessionPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(JoinSessionPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
