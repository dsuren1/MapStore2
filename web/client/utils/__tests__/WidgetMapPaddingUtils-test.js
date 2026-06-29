/**
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';

import {
    elementsOverlap,
    getVisibleOverlappingWidgetElements,
    getWidgetRightPadding,
    isElementVisible,
    resolveZoomToExtentPadding
} from '../WidgetMapPaddingUtils';

describe('WidgetMapPaddingUtils', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('isElementVisible returns false for missing or hidden elements', () => {
        expect(isElementVisible(null)).toBe(false);
        const hidden = document.createElement('div');
        hidden.style.display = 'none';
        document.body.appendChild(hidden);
        expect(isElementVisible(hidden)).toBe(false);
    });

    it('elementsOverlap detects intersection', () => {
        expect(elementsOverlap(
            { left: 0, right: 100, top: 0, bottom: 100 },
            { left: 50, right: 150, top: 50, bottom: 150 }
        )).toBe(true);
        expect(elementsOverlap(
            { left: 0, right: 100, top: 0, bottom: 100 },
            { left: 200, right: 300, top: 0, bottom: 100 }
        )).toBe(false);
    });

    it('getWidgetRightPadding returns 0 when no widgets overlap the map', () => {
        document.body.innerHTML = `
            <div id="map" style="position:absolute;left:0;top:0;width:1000px;height:600px;"></div>
        `;
        const map = document.getElementById('map');
        expect(getWidgetRightPadding(map)).toBe(0);
    });

    it('getWidgetRightPadding uses leftmost visible widget edge', () => {
        document.body.innerHTML = `
            <div id="map" style="position:absolute;left:0;top:0;width:1000px;height:600px;"></div>
            <div class="mapstore-widget-card" style="position:absolute;left:800px;top:100px;width:150px;height:150px;"></div>
            <div class="mapstore-widget-card" style="position:absolute;left:700px;top:200px;width:150px;height:150px;"></div>
        `;
        const map = document.getElementById('map');
        expect(getWidgetRightPadding(map)).toBe(300);
    });

    it('getVisibleOverlappingWidgetElements ignores widgets containing the map', () => {
        document.body.innerHTML = `
            <div class="mapstore-widget-card" style="position:absolute;left:100px;top:0;width:400px;height:400px;">
                <div id="embedded-map" style="width:300px;height:300px;"></div>
            </div>
            <div class="mapstore-widget-card" style="position:absolute;left:600px;top:0;width:200px;height:200px;"></div>
        `;
        const embeddedMap = document.getElementById('embedded-map');
        const widgets = getVisibleOverlappingWidgetElements(embeddedMap);
        expect(widgets.length).toBe(1);
        expect(widgets[0].getBoundingClientRect().left).toBe(600);
        expect(getWidgetRightPadding(embeddedMap)).toBe(200);
    });

    it('resolveZoomToExtentPadding ignores left layout padding and applies widget right padding', () => {
        document.body.innerHTML = `
            <div id="map" style="position:absolute;left:0;top:0;width:1000px;height:600px;"></div>
            <div class="mapstore-widget-card" style="position:absolute;left:750px;top:50px;width:200px;height:200px;"></div>
        `;
        const map = document.getElementById('map');
        const padding = resolveZoomToExtentPadding(map, { left: 500, top: 10, bottom: 140, right: 300 });
        expect(padding.left).toBe(0);
        expect(padding.top).toBe(10);
        expect(padding.bottom).toBe(140);
        expect(padding.right).toBe(250);
    });

    it('resolveZoomToExtentPadding keeps bottom layout padding when no widgets are visible', () => {
        document.body.innerHTML = `<div id="map" style="width:800px;height:400px;"></div>`;
        const padding = resolveZoomToExtentPadding(document.getElementById('map'), { left: 300, bottom: 120 });
        expect(padding).toEqual({ top: 0, right: 0, bottom: 120, left: 0 });
    });
});
