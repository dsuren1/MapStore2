/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import expect from 'expect';

import { testEpic, addTimeoutEpic, TEST_TIMEOUT } from './epicTestUtils';
import {
    openLayerFilterFromCardEpic,
    exportFilteredDataFromCardEpic
} from '../filterWidgetCard';
import {
    openLayerFilterFromCard,
    exportFilteredDataFromCard
} from '../../actions/filterWidgetCard';
import { DOWNLOAD } from '../../actions/layers';
import { EDIT, EDITOR_CHANGE, OPEN_FILTER_EDITOR } from '../../actions/widgets';

const WIDGET_ID = 'fw-1';
const FILTER_ID = 'flt-1';
const LAYER_ID = 'layer-1';

const makeState = ({ withLayer = true, filterOverrides = {} } = {}) => ({
    widgets: {
        containers: {
            floating: {
                widgets: [{
                    id: WIDGET_ID,
                    widgetType: 'filter',
                    filters: [{
                        id: FILTER_ID,
                        data: {
                            dataSource: 'features',
                            layer: { id: LAYER_ID, name: 'test:layer' }
                        },
                        ...filterOverrides
                    }],
                    selections: { [FILTER_ID]: [] }
                }]
            }
        }
    },
    layers: withLayer
        ? { flat: [{ id: LAYER_ID, name: 'test:layer', type: 'wms' }] }
        : { flat: [] }
});

describe('epics/filterWidgetCard', () => {
    describe('openLayerFilterFromCardEpic', () => {
        it('opens the widget builder, selects the filter, then opens the layer filter editor', (done) => {
            testEpic(
                openLayerFilterFromCardEpic,
                3,
                [openLayerFilterFromCard(WIDGET_ID, FILTER_ID)],
                (actions) => {
                    expect(actions.length).toBe(3);
                    // 1) enter the widget builder for this widget
                    expect(actions[0].type).toBe(EDIT);
                    expect(actions[0].widget.id).toBe(WIDGET_ID);
                    // 2) select the matching filter inside the builder
                    expect(actions[1].type).toBe(EDITOR_CHANGE);
                    expect(actions[1].key).toBe('selectedFilterId');
                    expect(actions[1].value).toBe(FILTER_ID);
                    // 3) open the in-builder layer filter editor (NOT the
                    //    TOC layer filter panel).
                    expect(actions[2].type).toBe(OPEN_FILTER_EDITOR);
                },
                makeState(),
                done
            );
        });

        it('emits nothing when no layer can be resolved', (done) => {
            testEpic(
                addTimeoutEpic(openLayerFilterFromCardEpic, 100),
                1,
                [openLayerFilterFromCard(WIDGET_ID, FILTER_ID)],
                (actions) => {
                    expect(actions.length).toBe(1);
                    expect(actions[0].type).toBe(TEST_TIMEOUT);
                },
                {
                    widgets: { containers: { floating: { widgets: [{
                        id: WIDGET_ID,
                        widgetType: 'filter',
                        filters: [{ id: FILTER_ID, data: { dataSource: 'features' } }]
                    }] } } },
                    layers: { flat: [] }
                },
                done
            );
        });
    });

    describe('exportFilteredDataFromCardEpic', () => {
        it('dispatches DOWNLOAD with the resolved layer', (done) => {
            testEpic(
                exportFilteredDataFromCardEpic,
                1,
                [exportFilteredDataFromCard(WIDGET_ID, FILTER_ID)],
                (actions) => {
                    expect(actions.length).toBe(1);
                    expect(actions[0].type).toBe(DOWNLOAD);
                    expect(actions[0].layer.id).toBe(LAYER_ID);
                },
                makeState(),
                done
            );
        });
    });
});
