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
import { Simulate } from 'react-dom/test-utils';
import FilterLayoutTab from '../FilterLayoutTab';

describe('FilterLayoutTab component', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('should render with defaults', () => {
        ReactDOM.render(<FilterLayoutTab />, document.getElementById("container"));
        const container = document.getElementById('container');
        const el = container.querySelector('.ms-filter-wizard-layout-tab');
        expect(el).toExist();
    });

    it('should call onChange when input changes', (done) => {
        ReactDOM.render(<FilterLayoutTab
            data={{ layout: {} }}
            onChange={(key, value) => {
                expect(key).toBe('layout.label');
                expect(value).toBe('Test Label');
                done();
            }}
        />, document.getElementById("container"));

        const container = document.getElementById('container');

        // Check there are 4 input groups before title click
        const itemInputs = container.querySelectorAll('.input-group');
        expect(itemInputs.length).toBe(4);

        // Find title inside panel-heading (1st) and find span
        const titlePanelHeader = container.querySelector('.ms-filter-title-panel .panel-heading');
        const titleSpan = titlePanelHeader.querySelector('span');
        expect(titleSpan).toExist();

        const titleToggle = titlePanelHeader.querySelector('.accordion-title');
        expect(titleToggle).toExist();
        Simulate.click(titleToggle);

        // Verify there are 6 input groups in title panel
        const titlePanel = container.querySelector('.ms-filter-title-panel');
        const titleInputs = titlePanel.querySelectorAll('.input-group');
        expect(titleInputs.length).toBe(6);

        const labelInput = container.querySelector('input[type="text"][placeholder*="label"]');
        expect(labelInput).toExist();
        labelInput.value = 'Test Label';
        Simulate.change(labelInput);
    });

    it('toggles layout.defaultExpanded via the new Items panel checkbox', (done) => {
        ReactDOM.render(<FilterLayoutTab
            data={{ layout: { defaultExpanded: true } }}
            onChange={(key, value) => {
                if (key === 'layout.defaultExpanded') {
                    expect(value).toBe(false);
                    done();
                }
            }}
        />, document.getElementById('container'));
        const container = document.getElementById('container');
        // Items panel is expanded by default; find all checkboxes and toggle
        // the one whose label includes the default-expanded message id.
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        // there are existing checkboxes (showSelectAll, showNoTargetsInfo,
        // forceSelection); the new defaultExpanded should be present too.
        expect(checkboxes.length).toBeGreaterThanOrEqualTo(4);
        // pick the checkbox associated with "defaultExpanded" via its
        // ControlLabel text content
        const formGroups = Array.from(container.querySelectorAll('.form-group-flex'));
        const target = formGroups.find(g => /defaultExpanded/.test(g.innerHTML));
        expect(target).toExist();
        const cb = target.querySelector('input[type="checkbox"]');
        expect(cb).toExist();
        Simulate.change(cb);
    });
});

