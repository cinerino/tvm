import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { factory } from '@cinerino/sdk';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Observable } from 'rxjs';
import { Functions, Models } from '../../../../../..';
import { getEnvironment } from '../../../../../../../environments/environment';
import { ActionService, MasterService, UtilService } from '../../../../../../services';
import * as reducers from '../../../../../../store/reducers';
import {
    PurchaseEventTicketModalComponent
} from '../../../../../shared/components/parts/purchase/event/ticket-modal/ticket-modal.component';

@Component({
    selector: 'app-purchase-event-ticket',
    templateUrl: './purchase-event-ticket.component.html',
    styleUrls: ['./purchase-event-ticket.component.scss']
})
export class PurchaseEventTicketComponent implements OnInit, OnDestroy {
    public purchase: Observable<reducers.IPurchaseState>;
    public user: Observable<reducers.IUserState>;
    public master: Observable<reducers.IMasterState>;
    public error: Observable<string | null>;
    public isLoading: Observable<boolean>;
    public screeningEventsGroup: Functions.Purchase.IScreeningEventsGroup[];
    public screeningEventSeries: factory.chevre.event.screeningEventSeries.IEvent[];
    public moment: typeof moment = moment;
    public environment = getEnvironment();
    private updateTimer: any;
    public screeningEventSeats: factory.chevre.place.seat.IPlaceWithOffer[];

    constructor(
        private store: Store<reducers.IState>,
        private router: Router,
        private utilService: UtilService,
        private translate: TranslateService,
        private actionService: ActionService,
        private masterService: MasterService,
        private modal: BsModalService
    ) { }

    public async ngOnInit() {
        this.purchase = this.store.pipe(select(reducers.getPurchase));
        this.user = this.store.pipe(select(reducers.getUser));
        this.master = this.store.pipe(select(reducers.getMaster));
        this.error = this.store.pipe(select(reducers.getError));
        this.isLoading = this.store.pipe(select(reducers.getLoading));
        this.actionService.purchase.unsettledDelete();
        this.screeningEventsGroup = [];
        this.purchase.subscribe((purchase) => {
            if (purchase.transaction === undefined) {
                this.router.navigate(['/error']);
                return;
            }
            this.getSchedule();
        }).unsubscribe();
    }

    public ngOnDestroy() {
        clearTimeout(this.updateTimer);
    }

    /**
     * 更新
     */
    private update() {
        if (this.updateTimer !== undefined) {
            clearTimeout(this.updateTimer);
        }
        const time = 600000; // 10 * 60 * 1000
        this.updateTimer = setTimeout(() => {
            this.getSchedule();
        }, time);
    }

    /**
     * スケジュール取得
     */
    public async getSchedule() {
        try {
            const user = await this.actionService.user.getData();
            const purchase = await this.actionService.purchase.getData();
            const theater = user.theater;
            const scheduleDate = purchase.scheduleDate;
            if (theater === undefined || scheduleDate === undefined) {
                throw new Error('theater === undefined || scheduleDate === undefined').message;
            }
            this.screeningEventSeries = await this.masterService.searchScreeningEventSeries({
                workPerformed: {
                    identifiers: [],
                },
                location: {
                    branchCode: {
                        $eq: theater.branchCode
                    }
                }
            });
            const screeningEvents = await this.masterService.searchScreeningEvent({
                superEvent: { locationBranchCodes: [theater.branchCode] },
                startFrom: moment(scheduleDate).toDate(),
                startThrough: moment(scheduleDate).add(1, 'day').add(-1, 'millisecond').toDate(),
                screeningEventSeries: this.screeningEventSeries
            });
            this.screeningEventsGroup = Functions.Purchase.screeningEvents2ScreeningEventsGroup({ screeningEvents });
            this.update();
        } catch (error) {
            console.error(error);
            this.router.navigate(['/error']);
        }
    }

    /**
     * スケジュール選択
     */
    public async selectSchedule(screeningEvent: factory.event.screeningEvent.IEvent) {
        const purchase = await this.actionService.purchase.getData();
        if (purchase.seller === undefined) {
            this.router.navigate(['/error']);
            return;
        }
        if (purchase.authorizeSeatReservations.length > 0
            && Number(this.environment.PURCHASE_ITEM_MAX_LENGTH) === 1) {
            this.utilService.openAlert({
                title: this.translate.instant('common.error'),
                body: this.translate.instant('purchase.event.ticket.alert.cart')
            });
            return;
        }
        try {
            await this.actionService.purchase.getScreeningEvent(screeningEvent);
            this.screeningEventSeats = await this.actionService.purchase.getScreeningEventSeats();
            await this.actionService.purchase.getTicketList({ seller: purchase.seller });
            await this.actionService.purchase.getScreen({
                branchCode: { $eq: screeningEvent.location.branchCode },
                containedInPlace: {
                    branchCode: { $eq: screeningEvent.superEvent.location.branchCode }
                }
            });
            this.openTicketList();
        } catch (error) {
            console.error(error);
            this.utilService.openAlert({
                title: this.translate.instant('common.error'),
                body: ''
            });
        }
    }

    /**
     * 券種表示
     */
    private async openTicketList() {
        const purchase = await this.actionService.purchase.getData();
        const screeningEvent = purchase.screeningEvent;
        const screeningEventTicketOffers = purchase.screeningEventTicketOffers;
        const screeningEventSeats = this.screeningEventSeats;
        const screen = purchase.screen;
        if (screeningEvent === undefined || screen === undefined) {
            return;
        }
        const performance = new Models.Purchase.Performance(screeningEvent);
        if (!performance.isInfinitetock()
            && !screen.openSeatingAllowed
            && performance.isTicketedSeat()) {
            // 座席選択あり
            this.router.navigate(['/purchase/event/seat']);
            return;
        }
        // 座席選択なし
        this.modal.show(PurchaseEventTicketModalComponent, {
            class: 'modal-dialog-centered modal-lg',
            backdrop: 'static',
            initialState: {
                screeningEventTicketOffers,
                screeningEventSeats,
                screeningEvent,
                cb: (params: {
                    reservations: Models.Purchase.Reservation.IReservation[];
                    additionalTicketText?: string;
                }) => {
                    this.selectTicket(params);
                }
            }
        });
    }

    /**
     * 券種選択
     */
    private async selectTicket(params: {
        reservations: Models.Purchase.Reservation.IReservation[];
        additionalTicketText?: string;
    }) {
        const reservations = params.reservations;
        const additionalTicketText = params.additionalTicketText;
        if (reservations.length > Number(this.environment.PURCHASE_ITEM_MAX_LENGTH)) {
            this.utilService.openAlert({
                title: this.translate.instant('common.error'),
                body: this.translate.instant(
                    'purchase.event.ticket.alert.limit',
                    { value: this.environment.PURCHASE_ITEM_MAX_LENGTH }
                )
            });
            return;
        }
        try {
            this.screeningEventSeats = await this.actionService.purchase.getScreeningEventSeats();
            const purchase = await this.actionService.purchase.getData();
            if (purchase.screeningEvent !== undefined
                && new Models.Purchase.Performance(purchase.screeningEvent).isTicketedSeat()) {
                const remainingSeatLength = Functions.Purchase.getRemainingSeatLength({
                    screeningEventSeats: this.screeningEventSeats,
                    screeningEvent: purchase.screeningEvent
                });
                if (remainingSeatLength < reservations.length) {
                    this.utilService.openAlert({
                        title: this.translate.instant('common.error'),
                        body: this.translate.instant('purchase.event.ticket.alert.getScreeningEventSeats')
                    });
                    return;
                }
            }
        } catch (error) {
            console.error(error);
            this.utilService.openAlert({
                title: this.translate.instant('common.error'),
                body: ''
            });
        }

        try {
            await this.actionService.purchase.temporaryReservation({
                reservations,
                additionalTicketText,
                screeningEventSeats: this.screeningEventSeats
            });
            this.utilService.openAlert({
                title: this.translate.instant('common.complete'),
                body: this.translate.instant('purchase.event.ticket.success.temporaryReservation')
            });
            this.actionService.purchase.unsettledDelete();
        } catch (error) {
            console.error(error);
            this.utilService.openAlert({
                title: this.translate.instant('common.error'),
                body: `
                <p class="mb-4">${this.translate.instant('purchase.event.ticket.alert.temporaryReservation')}</p>
                <div class="p-3 bg-light-gray select-text text-left">
                    <code>${error}</code>
                </div>`
            });
        }
    }

    /**
     * 券種確定
     */
    public async onSubmit() {
        const { authorizeSeatReservations } = await this.actionService.purchase.getData();
        // チケット未選択判定
        if (authorizeSeatReservations.length === 0) {
            this.utilService.openAlert({
                title: this.translate.instant('common.error'),
                body: this.translate.instant('purchase.event.ticket.alert.unselected')
            });
            return;
        }
        // チケット枚数上限判定
        let itemCount = 0;
        authorizeSeatReservations.forEach(a => itemCount += a.object.acceptedOffer.length);
        if (itemCount > Number(this.environment.PURCHASE_ITEM_MAX_LENGTH)) {
            this.utilService.openAlert({
                title: this.translate.instant('common.error'),
                body: this.translate.instant(
                    'purchase.event.ticket.alert.limit',
                    { value: Number(this.environment.PURCHASE_ITEM_MAX_LENGTH) }
                )
            });
            return;
        }
    }

    /**
     * カート削除確認
     */
    public removeItem(
        authorizeSeatReservation: factory.action.authorize.offer.seatReservation.IAction<factory.service.webAPI.Identifier.Chevre>
    ) {
        this.utilService.openConfirm({
            title: this.translate.instant('common.confirm'),
            body: this.translate.instant('purchase.event.cart.confirm.cancel'),
            cb: async () => {
                try {
                    const authorizeSeatReservations = [authorizeSeatReservation];
                    await this.actionService.purchase.cancelTemporaryReservations(authorizeSeatReservations);
                } catch (error) {
                    console.error(error);
                    this.router.navigate(['/error']);
                }
            }
        });
    }

    /**
     * 施設コンテンツ取得
     */
    public getScreeningEventSeries(id: string) {
        return this.screeningEventSeries.find(s => s.id === id);
    }

}

