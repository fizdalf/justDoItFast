import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectIconPageComponent } from './select-icon-page.component';

describe('SelectIconPageComponent', () => {
  let component: SelectIconPageComponent;
  let fixture: ComponentFixture<SelectIconPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectIconPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectIconPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
