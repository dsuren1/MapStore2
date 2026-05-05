/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import expect from 'expect';

import {
    FILTER_WIDGET_CARD_ZOOM,
    FILTER_WIDGET_CARD_OPEN_LAYER_FILTER,
    FILTER_WIDGET_CARD_EXPORT,
    zoomToFilteredFeatures,
    openLayerFilterFromCard,
    exportFilteredDataFromCard
} from '../filterWidgetCard';

describe('actions/filterWidgetCard', () => {
    it('zoomToFilteredFeatures emits FILTER_WIDGET_CARD_ZOOM with widget/filter ids', () => {
        const action = zoomToFilteredFeatures('w1', 'f1');
        expect(action).toEqual({
            type: FILTER_WIDGET_CARD_ZOOM,
            widgetId: 'w1',
            filterId: 'f1',
            target: 'floating'
        });
    });
    it('openLayerFilterFromCard emits FILTER_WIDGET_CARD_OPEN_LAYER_FILTER with widget/filter ids', () => {
        const action = openLayerFilterFromCard('w1', 'f1', 'someTarget');
        expect(action).toEqual({
            type: FILTER_WIDGET_CARD_OPEN_LAYER_FILTER,
            widgetId: 'w1',
            filterId: 'f1',
            target: 'someTarget'
        });
    });
    it('exportFilteredDataFromCard emits FILTER_WIDGET_CARD_EXPORT with widget/filter ids', () => {
        const action = exportFilteredDataFromCard('w1', 'f1');
        expect(action).toEqual({
            type: FILTER_WIDGET_CARD_EXPORT,
            widgetId: 'w1',
            filterId: 'f1',
            target: 'floating'
        });
    });
});
