import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';


@Component({
    selector: 'org-game-home-page',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './game-home-page.component.html',
    styleUrl: './game-home-page.component.scss',
})
export class GameHomePageComponent {
    constructor() {

    }

}
