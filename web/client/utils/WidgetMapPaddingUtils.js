/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const WIDGET_CARD_SELECTOR = '.mapstore-widget-card';

/**
 * Returns true when the element is rendered and visible in the DOM.
 * @param {HTMLElement} element
 * @returns {boolean}
 */
export const isElementVisible = (element) => {
    if (!element || typeof element.getBoundingClientRect !== 'function') {
        return false;
    }
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
        return false;
    }
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
        return false;
    }
    return true;
};

/**
 * Returns true when two bounding rectangles overlap.
 * @param {DOMRect} a
 * @param {DOMRect} b
 * @returns {boolean}
 */
export const elementsOverlap = (a, b) =>
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/**
 * Collect visible widget cards overlapping the map container, excluding the
 * widget card that contains the map itself (relevant for embedded map widgets).
 * @param {HTMLElement} mapContainer
 * @param {Document} doc
 * @returns {HTMLElement[]}
 */
export const getVisibleOverlappingWidgetElements = (mapContainer, doc = document) => {
    if (!mapContainer || typeof mapContainer.getBoundingClientRect !== 'function') {
        return [];
    }
    const mapRect = mapContainer.getBoundingClientRect();
    return Array.from(doc.querySelectorAll(WIDGET_CARD_SELECTOR))
        .filter((element) => !element.contains(mapContainer))
        .filter(isElementVisible)
        .filter((element) => elementsOverlap(element.getBoundingClientRect(), mapRect));
};

/**
 * Compute dynamic right padding from visible widgets obstructing the map.
 * rightPadding = mapContainer.right - leftMostVisibleWidget.left
 * @param {HTMLElement} mapContainer
 * @param {Document} doc
 * @returns {number}
 */
export const getWidgetRightPadding = (mapContainer, doc = document) => {
    const widgets = getVisibleOverlappingWidgetElements(mapContainer, doc);
    if (!widgets.length) {
        return 0;
    }
    const mapRect = mapContainer.getBoundingClientRect();
    const leftMost = Math.min(...widgets.map((element) => element.getBoundingClientRect().left));
    return Math.max(0, Math.round(mapRect.right - leftMost));
};

/**
 * Resolve padding for map fit/zoom operations.
 * Ignores left side panel padding and applies widget-aware right padding.
 * @param {HTMLElement} mapContainer
 * @param {object} layoutPadding padding from map layout selectors (top/bottom)
 * @param {Document} doc
 * @returns {{top: number, right: number, bottom: number, left: number}}
 */
export const resolveZoomToExtentPadding = (mapContainer, layoutPadding, doc = document) => ({
    top: layoutPadding?.top || 0,
    bottom: layoutPadding?.bottom || 0,
    left: 0,
    right: getWidgetRightPadding(mapContainer, doc)
});
