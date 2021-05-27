import { factory } from '@cinerino/sdk';
import { Action, createReducer, on } from '@ngrx/store';
import { IState } from '.';
import { Models } from '../..';
import { userAction } from '../actions';

export interface IUserState {
    /**
     * POS
     */
    pos?: factory.chevre.place.movieTheater.IPOS;
    /**
     * 劇場
     */
    theater?: factory.chevre.place.movieTheater.IPlaceWithoutScreeningRoom;
    /**
     * 購入者情報
     */
    customerContact?: factory.person.IProfile;
    /**
     * プリンター
     */
    printer?: Models.Util.Printer.IPrinter;
    /**
     * 決済
     */
    payment?: string;
    /**
     * 釣り銭
     */
    cashchanger?: string;
    /**
     * アプリケーションタイプ
     */
    applicationType?: Models.Util.Application.ApplicationType;
    /**
     * 言語
     */
    language: string;
    /**
     * バージョン
     */
    version?: string;
}

export const userInitialState: IUserState = {
    language: 'ja',
};

export function reducer(initialState: IState, action: Action) {
    return createReducer(
        initialState,
        on(userAction.remove, (state) => {
            return {
                ...state,
                userData: {
                    language: 'ja',
                },
                loading: false,
                process: '',
            };
        }),
        on(userAction.updateAll, (state, payload) => {
            const customerContact = payload.customerContact;
            const pos = payload.pos;
            const theater = payload.theater;
            const printer = payload.printer;
            const cashchanger = payload.cashchanger;
            const payment = payload.payment;
            const applicationType = payload.applicationType;

            return {
                ...state,
                userData: {
                    ...state.userData,
                    customerContact,
                    pos,
                    theater,
                    printer,
                    cashchanger,
                    payment,
                    applicationType,
                },
                loading: false,
                process: '',
            };
        }),
        on(userAction.updateLanguage, (state, payload) => {
            const language = payload.language;
            return { ...state, userData: { ...state.userData, language } };
        }),
        on(userAction.setVersion, (state, payload) => {
            const version = payload.version;
            return { ...state, userData: { ...state.userData, version } };
        })
    )(initialState, action);
}
