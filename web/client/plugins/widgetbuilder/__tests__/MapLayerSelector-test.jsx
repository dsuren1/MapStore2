/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import expect from 'expect';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Simulate } from 'react-dom/test-utils';

import MapLayerSelector from '../MapLayerSelector';

const makeStore = (layers) => ({
    subscribe: () => () => {},
    getState: () => ({
        layers: { flat: layers }
    }),
    dispatch: () => {}
});

describe('MapLayerSelector plugin component', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });
    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById('container'));
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('lists only layers supported by interactions (wms/wfs, non-background)', () => {
        const layers = [
            { id: 'a', name: 'a', title: 'A', type: 'wms', group: 'group1' },
            { id: 'b', name: 'b', title: 'B', type: 'wms', group: 'background' },
            { id: 'c', name: 'c', title: 'C', type: 'wfs' },
            { id: 'd', name: 'd', title: 'D', type: 'vector' }
        ];
        ReactDOM.render(
            <Provider store={makeStore(layers)}>
                <MapLayerSelector
                    onClose={() => {}}
                    onLayerChoice={() => {}}
                    toggleLayerSelector={() => {}}
                />
            </Provider>,
            document.getElementById('container')
        );
        const items = document.querySelectorAll('.list-group-item');
        // a (wms ok), c (wfs ok). b (background) and d (vector) excluded
        expect(items.length).toBe(2);
        const labels = Array.from(items).map(i => i.textContent);
        expect(labels.some(t => t.indexOf('A') >= 0)).toBe(true);
        expect(labels.some(t => t.indexOf('C') >= 0)).toBe(true);
        expect(labels.some(t => t.indexOf('B') >= 0)).toBe(false);
        expect(labels.some(t => t.indexOf('D') >= 0)).toBe(false);
    });

    it('emits filter-add with the selected layers when proceeding without a showLayers context', () => {
        const layers = [
            { id: 'a', name: 'a', title: 'A', type: 'wms' },
            { id: 'b', name: 'b', title: 'B', type: 'wfs' }
        ];
        let captured = null;
        ReactDOM.render(
            <Provider store={makeStore(layers)}>
                <MapLayerSelector
                    onClose={() => {}}
                    onLayerChoice={(key, value) => { captured = { key, value }; }}
                    toggleLayerSelector={() => {}}
                />
            </Provider>,
            document.getElementById('container')
        );
        // click first layer radio (single-select only)
        const radios = document.querySelectorAll('.list-group-item input[type="radio"]');
        Simulate.change(radios[0]);
        // proceed
        const proceed = document.querySelector('button .glyphicon-arrow-right');
        expect(proceed).toExist();
        Simulate.click(proceed.closest('button'));
        expect(captured).toExist();
        expect(captured.key).toBe('filter-add');
        expect(Array.isArray(captured.value)).toBe(true);
        expect(captured.value.length).toBe(1);
        expect(captured.value[0].id).toBe('a');
    });

    it('only allows a single layer to be selected (radio behavior)', () => {
        const layers = [
            { id: 'a', name: 'a', title: 'A', type: 'wms' },
            { id: 'b', name: 'b', title: 'B', type: 'wfs' }
        ];
        let captured = null;
        ReactDOM.render(
            <Provider store={makeStore(layers)}>
                <MapLayerSelector
                    onClose={() => {}}
                    onLayerChoice={(key, value) => { captured = { key, value }; }}
                    toggleLayerSelector={() => {}}
                />
            </Provider>,
            document.getElementById('container')
        );
        const radios = document.querySelectorAll('.list-group-item input[type="radio"]');
        Simulate.change(radios[0]);
        Simulate.change(radios[1]);
        const proceed = document.querySelector('button .glyphicon-arrow-right');
        Simulate.click(proceed.closest('button'));
        expect(captured.value.length).toBe(1);
        expect(captured.value[0].id).toBe('b');
    });

    it('shows the empty-state message when no filterable layers exist', () => {
        ReactDOM.render(
            <Provider store={makeStore([{ id: 'd', type: 'vector' }])}>
                <MapLayerSelector
                    onClose={() => {}}
                    onLayerChoice={() => {}}
                    toggleLayerSelector={() => {}}
                />
            </Provider>,
            document.getElementById('container')
        );
        const items = document.querySelectorAll('.list-group-item');
        expect(items.length).toBe(0);
        const empty = document.querySelector('.ms-map-layer-selector .text-muted');
        expect(empty).toExist();
    });
});
