import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateSessionPageComponent } from './create-session-page.component';

describe('CreateSessionPageComponent', () => {
  let component: CreateSessionPageComponent;
  let fixture: ComponentFixture<CreateSessionPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateSessionPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateSessionPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
