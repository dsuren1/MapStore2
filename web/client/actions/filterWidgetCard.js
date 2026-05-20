/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Action types for per-filter card quick actions handled by epics
 * (see web/client/epics/filterWidgetCard.js).
 */
export const FILTER_WIDGET_CARD_ZOOM = 'WIDGETS:FILTER_CARD_ZOOM';
export const FILTER_WIDGET_CARD_OPEN_LAYER_FILTER = 'WIDGETS:FILTER_CARD_OPEN_LAYER_FILTER';
export const FILTER_WIDGET_CARD_EXPORT = 'WIDGETS:FILTER_CARD_EXPORT';

/**
 * Zoom the map to the bbox of the filtered features for a single filter
 * inside a Filter widget.
 * @param {string} widgetId
 * @param {string} filterId
 * @param {string} [target='floating']
 */
export const zoomToFilteredFeatures = (widgetId, filterId, target = 'floating') => ({
    type: FILTER_WIDGET_CARD_ZOOM,
    widgetId,
    filterId,
    target
});

/**
 * Open the per-layer filter (Query) panel for a filter's source layer.
 * @param {string} widgetId
 * @param {string} filterId
 * @param {string} [target='floating']
 */
export const openLayerFilterFromCard = (widgetId, filterId, target = 'floating') => ({
    type: FILTER_WIDGET_CARD_OPEN_LAYER_FILTER,
    widgetId,
    filterId,
    target
});

/**
 * Open the LayerDownload dialog pre-filled with the CQL composed from this
 * filter's selections.
 * @param {string} widgetId
 * @param {string} filterId
 * @param {string} [target='floating']
 */
export const exportFilteredDataFromCard = (widgetId, filterId, target = 'floating') => ({
    type: FILTER_WIDGET_CARD_EXPORT,
    widgetId,
    filterId,
    target
});
