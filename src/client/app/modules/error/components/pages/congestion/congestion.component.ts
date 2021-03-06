import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { getEnvironment } from '../../../../../../environments/environment';

@Component({
    selector: 'app-congestion',
    templateUrl: './congestion.component.html',
    styleUrls: ['./congestion.component.scss']
})
export class CongestionComponent implements OnInit, OnDestroy {
    public environment = getEnvironment();
    private timer: any;

    constructor(
        private router: Router
    ) { }

    public ngOnInit() {
        if (this.environment.ERROR_WAIT_TIME === '') {
            return;
        }
        const time = Number(this.environment.ERROR_WAIT_TIME);
        this.timer = setTimeout(() => {
            this.router.navigate(['/']);
        }, time);
    }

    /**
     * 破棄
     */
    public ngOnDestroy() {
        if (this.timer !== undefined) {
            clearTimeout(this.timer);
        }
    }

}
