import {ComponentFixture, TestBed} from '@angular/core/testing';
import {GameHomePageComponent} from './game-home-page.component';
import {provideRouter} from "@angular/router";

describe('HomePageComponent', () => {
    let component: GameHomePageComponent;
    let fixture: ComponentFixture<GameHomePageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({

            imports: [GameHomePageComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(GameHomePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
