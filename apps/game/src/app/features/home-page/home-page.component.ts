import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';


@Component({
    selector: 'org-home-page',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './home-page.component.html',
    styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
    constructor() {

    }

}
