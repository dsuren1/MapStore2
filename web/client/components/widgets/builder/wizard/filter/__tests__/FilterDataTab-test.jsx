/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import React from 'react';
import ReactDOM from 'react-dom';
import FilterDataTab from '../FilterDataTab/index';
import { DATA_SOURCE_TYPES } from '../FilterDataTab/constants';

describe('FilterDataTab component', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('should render with defaults and have correct number of input groups', () => {
        ReactDOM.render(
            <FilterDataTab
                data={{
                    data: {
                        dataSource: DATA_SOURCE_TYPES.FEATURES,
                        valuesFrom: 'grouped',
                        filterComposition: 'AND'
                    }
                }}
                onChange={() => {}}
                onOpenLayerSelector={() => {}}
                onEditorChange={() => {}}
            />,
            document.getElementById("container")
        );
        const container = document.getElementById('container');
        const el = container.querySelector('.ms-filter-wizard-data-tab');
        expect(el).toExist();

        // Check number of input groups
        const inputGroups = container.querySelectorAll('.input-group');
        expect(inputGroups.length).toBe(8);
    });

    it('does not render a per-filter description field', () => {
        // The description field was removed by request; the data tab must
        // not expose a textarea for it any more.
        ReactDOM.render(
            <FilterDataTab
                data={{
                    data: {
                        dataSource: DATA_SOURCE_TYPES.FEATURES,
                        valuesFrom: 'grouped',
                        filterComposition: 'AND'
                    }
                }}
                onChange={() => {}}
                onOpenLayerSelector={() => {}}
                onEditorChange={() => {}}
            />,
            document.getElementById('container')
        );
        const container = document.getElementById('container');
        expect(container.querySelector('textarea')).toNotExist();
    });

    it('passes mapLayersOnly through to LayerSelectorField so the field is editable', () => {
        ReactDOM.render(
            <FilterDataTab
                data={{
                    data: {
                        dataSource: DATA_SOURCE_TYPES.FEATURES,
                        valuesFrom: 'grouped',
                        filterComposition: 'AND',
                        layer: { name: 'L', title: 'L' }
                    }
                }}
                onChange={() => {}}
                onOpenLayerSelector={() => {}}
                onEditorChange={() => {}}
                mapLayersOnly
            />,
            document.getElementById('container')
        );
        const container = document.getElementById('container');
        const layerInput = container.querySelector('input[type="text"]');
        expect(layerInput).toExist();
        // when mapLayersOnly is true the input must NOT be disabled
        expect(layerInput.disabled).toBe(false);
    });
});

