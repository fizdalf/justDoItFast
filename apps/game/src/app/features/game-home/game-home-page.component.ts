import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import {GameHomePageStore, GameHomePageViewModel} from "./game-home-page.store";
import {GameService} from "../../services/game/game.service";
import {GameApiService} from "../../services/game/game-api.service";
import {Observable} from "rxjs";


@Component({
    selector: 'org-game-home-page',
    standalone: true,
    imports: [CommonModule, RouterLink],
    providers: [
        GameHomePageStore,
        {
            provide: GameService,
            useClass: GameApiService
        }
    ],
    templateUrl: './game-home-page.component.html',
    styleUrl: './game-home-page.component.scss',
})
export class GameHomePageComponent {
    vm$: Observable<GameHomePageViewModel> = this.store.vm$;

    constructor(private store: GameHomePageStore) {

    }

    startGame() {

    }
}
