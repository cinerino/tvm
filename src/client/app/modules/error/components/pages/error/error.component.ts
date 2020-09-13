import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { ActionService } from '../../../../../services';
import * as reducers from '../../../../../store/reducers';

@Component({
    selector: 'app-error',
    templateUrl: './error.component.html',
    styleUrls: ['./error.component.scss']
})
export class ErrorComponent implements OnInit {
    public error: Observable<string | null>;
    constructor(
        private store: Store<reducers.IState>,
        private actionService: ActionService
    ) { }

    public async ngOnInit() {
        try {
            await this.actionService.purchase.depositRepay();
        } catch (error) {
            console.error(error);
        }
        this.error = this.store.pipe(select(reducers.getError));
        this.actionService.purchase.delete();
    }

}
