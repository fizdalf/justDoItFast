import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogRef,
    MatDialogTitle
} from '@angular/material/dialog';

@Component({
    selector: 'org-player-name',
    imports: [
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        MatButtonModule,
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        MatDialogClose,
    ],
    standalone: true,
    templateUrl: './player-name-request-dialog.component.html',
    styleUrl: './player-name-request-dialog.component.scss',
})
export class PlayerNameRequestDialog {

    public playerName: string = '';

    constructor(public dialogRef: MatDialogRef<PlayerNameRequestDialog>) {
    }

    onNoClick() {
        this.dialogRef.close();
    }
}
