import { factory } from '@cinerino/sdk';
import { Action, createReducer, on } from '@ngrx/store';
import { IState } from '.';
import { getEnvironment } from '../../../environments/environment';
import { orderAction } from '../actions';

export interface IOrderState {
    order?: factory.order.IOrder;
}

export const orderInitialState: IOrderState = {};

export function reducer(initialState: IState, action: Action) {
    const environment = getEnvironment();
    return createReducer(
        initialState,
        on(orderAction.remove, state => {
            return { ...state, orderData: {} };
        }),
        on(orderAction.cancel, (state) => {
            return { ...state, loading: true, process: 'orderAction.Cancel' };
        }),
        on(orderAction.cancelSuccess, (state) => {
            return { ...state, loading: false, process: '', error: null };
        }),
        on(orderAction.cancelFail, (state, payload) => {
            const error = payload.error;
            return { ...state, loading: false, process: '', error: JSON.stringify(error) };
        }),
        on(orderAction.inquiry, (state) => {
            return { ...state, loading: true, process: 'orderAction.Inquiry' };
        }),
        on(orderAction.inquirySuccess, (state, payload) => {
            const order = payload.order;
            return { ...state, orderData: { ...state.orderData, order }, loading: false, process: '', error: null };
        }),
        on(orderAction.inquiryFail, (state, payload) => {
            const error = payload.error;
            return { ...state, loading: false, process: '', error: JSON.stringify(error) };
        }),
        on(orderAction.print, (state) => {
            return { ...state, loading: environment.PRINT_LOADING, process: 'orderAction.Print' };
        }),
        on(orderAction.printSuccess, (state) => {
            return { ...state, loading: false, process: '', error: null };
        }),
        on(orderAction.printFail, (state, payload) => {
            const error = payload.error;
            return { ...state, loading: false, process: '', error: JSON.stringify(error) };
        }),
    )(initialState, action);
}
