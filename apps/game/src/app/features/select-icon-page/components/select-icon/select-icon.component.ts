import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';

import {MatIcon} from '@angular/material/icon';

@Component({
    selector: 'org-select-icon',
    standalone: true,
    imports: [CommonModule, MatIcon, NgOptimizedImage],
    templateUrl: './select-icon.component.html',
    styleUrl: './select-icon.component.scss',
})
export class SelectIconComponent {
    @Input() availableIcons!: any[];
    @Output() iconSelected = new EventEmitter<any>();

    selectIcon(icon: any) {
        this.iconSelected.emit(icon);
    }
}
