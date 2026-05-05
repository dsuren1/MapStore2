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
import { Simulate } from 'react-dom/test-utils';

import FilterPerItemToolbar from '../FilterPerItemToolbar';

const filterDataFeatures = {
    id: 'f-1',
    disabled: false,
    data: { dataSource: 'features', layer: { id: 'l1', name: 'test' } }
};

const filterDataNoLayer = {
    id: 'f-2',
    disabled: false,
    data: { dataSource: 'features' }
};

describe('FilterPerItemToolbar component', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });
    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById('container'));
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('renders all action icons and the collapse chevron when handlers are provided', () => {
        const container = document.getElementById('container');
        ReactDOM.render(
            <FilterPerItemToolbar
                filterData={filterDataFeatures}
                onToggleCollapse={() => {}}
                onZoom={() => {}}
                onOpenLayerFilter={() => {}}
                onExport={() => {}}
                onToggleDisabled={() => {}}
            />,
            container
        );
        const toolbar = container.querySelector('.ms-filter-card-toolbar');
        expect(toolbar).toExist();
        const buttons = toolbar.querySelectorAll('button');
        // 4 ToolButtons (zoom, open layer filter, export, collapse)
        expect(buttons.length).toBeGreaterThanOrEqualTo(4);
    });

    it('disables zoom + export + open layer filter when filter has no layer', () => {
        const container = document.getElementById('container');
        ReactDOM.render(
            <FilterPerItemToolbar
                filterData={filterDataNoLayer}
                onToggleCollapse={() => {}}
                onZoom={() => {}}
                onOpenLayerFilter={() => {}}
                onExport={() => {}}
            />,
            container
        );
        const buttons = container.querySelectorAll('.ms-filter-card-toolbar button');
        // first three (zoom/openLayerFilter/export) should be disabled
        const disabled = Array.from(buttons).filter(b => b.disabled);
        expect(disabled.length).toBeGreaterThanOrEqualTo(3);
    });

    it('disables zoom + export when the filter is disabled, but keeps open layer filter and toggle usable', () => {
        const container = document.getElementById('container');
        ReactDOM.render(
            <FilterPerItemToolbar
                filterData={{ ...filterDataFeatures, disabled: true }}
                onToggleCollapse={() => {}}
                onZoom={() => {}}
                onOpenLayerFilter={() => {}}
                onExport={() => {}}
                onToggleDisabled={() => {}}
            />,
            container
        );
        const buttons = container.querySelectorAll('.ms-filter-card-toolbar button');
        const disabled = Array.from(buttons).filter(b => b.disabled);
        // zoom + export = 2 disabled buttons; openLayerFilter remains enabled
        expect(disabled.length).toBe(2);
    });

    it('invokes onToggleCollapse when the collapse chevron is clicked', () => {
        const container = document.getElementById('container');
        let clicked = false;
        ReactDOM.render(
            <FilterPerItemToolbar
                filterData={filterDataFeatures}
                onToggleCollapse={() => { clicked = true; }}
            />,
            container
        );
        const buttons = container.querySelectorAll('.ms-filter-card-toolbar button');
        // only the chevron is rendered (no other handlers passed)
        expect(buttons.length).toBe(1);
        Simulate.click(buttons[0]);
        expect(clicked).toBe(true);
    });
});
