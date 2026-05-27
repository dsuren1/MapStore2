/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Rx from 'rxjs';
import { get } from 'lodash';
import bbox from '@turf/bbox';

import {
    FILTER_WIDGET_CARD_ZOOM,
    FILTER_WIDGET_CARD_OPEN_LAYER_FILTER,
    FILTER_WIDGET_CARD_EXPORT
} from '../actions/filterWidgetCard';
import { zoomToExtent } from '../actions/map';
import { download } from '../actions/layers';
import { editWidget, onEditorChange, openFilterEditor } from '../actions/widgets';
import { error as showError } from '../actions/notifications';
import { getLayerJSONFeature } from '../observables/wfs';
import { processFilterToCQL } from '../utils/FilterEventUtils';
import { cqlToOgc } from '../utils/FilterUtils';
import { layersSelector } from '../selectors/layers';

const findFilterAndLayer = (state, widgetId, target, filterId) => {
    const widget = get(state, `widgets.containers[${target}].widgets`, []).find(w => w.id === widgetId);
    if (!widget) {
        return {};
    }
    const filter = (widget.filters || []).find(f => f.id === filterId);
    if (!filter) {
        return { widget };
    }
    const layerRef = filter?.data?.layer;
    if (!layerRef) {
        return { widget, filter };
    }
    // resolve to the live map layer (layer ref on the filter may be a stale copy)
    const liveLayer = (layersSelector(state) || []).find(l => l.id === layerRef.id || l.name === layerRef.name) || layerRef;
    return { widget, filter, layer: liveLayer };
};

/**
 * Build a server-side CQL filter object suitable for getLayerJSONFeature
 * from the filter widget's selections + noSelectionMode.
 */
const buildFilterFromWidget = (filter, selections) => {
    const filterSelections = selections?.[filter.id] || [];
    return processFilterToCQL(filter, filterSelections);
};

/**
 * Zoom to bbox of the filtered features for a single filter card.
 *
 * The WFS request is built as an OGC POST body so the CQL produced by the
 * widget can be sent reliably (the previous implementation tried to inline
 * a CQL string into the OGC filter parts list, which did not produce a
 * valid OGC filter and led to either no zoom or a zoom on the full extent).
 */
export const zoomToFilteredFeaturesEpic = (action$, store) =>
    action$.ofType(FILTER_WIDGET_CARD_ZOOM)
        .switchMap(({ widgetId, filterId, target }) => {
            const state = store.getState();
            const { widget, filter, layer } = findFilterAndLayer(state, widgetId, target, filterId);
            if (!filter || !layer) {
                return Rx.Observable.of(showError({
                    title: 'widgets.filterWidget.zoomError.title',
                    message: 'widgets.filterWidget.zoomError.noLayer',
                    autoDismiss: 4
                }));
            }
            if (filter?.disabled === true) {
                return Rx.Observable.empty();
            }
            const cqlFilter = buildFilterFromWidget(filter, widget.selections || {});

            // prefer filter.data.maxFeatures, cap to a sane limit
            const maxFeatures = Math.min(filter?.data?.maxFeatures || 1000, 5000);

            // The previous version inlined a raw CQL string as an OGC filter
            // part — that produced an invalid OGC body so the server
            // returned the full feature set (or nothing) and zoom was wrong.
            // Convert CQL → OGC and wrap in <ogc:Filter> so the request
            // builder splices a valid filter into <wfs:Query>.
            const ogcFilterPart = cqlFilter?.body ? cqlToOgc(cqlFilter.body) : null;
            const wrappedOgcFilter = ogcFilterPart
                ? `<ogc:Filter>${ogcFilterPart}</ogc:Filter>`
                : undefined;

            // Geometry is required to compute a bbox; fetching only the
            // geometry property keeps the response small.
            const propertyName = layer.geometryName ? [layer.geometryName] : undefined;

            return Rx.Observable.defer(() => getLayerJSONFeature(
                layer,
                wrappedOgcFilter,
                { propertyName, maxFeatures }
            ))
                .map((featureCollection) => {
                    const features = (featureCollection?.features || [])
                        .filter(f => f && f.geometry);
                    if (features.length === 0) {
                        return showError({
                            title: 'widgets.filterWidget.zoomError.title',
                            message: 'widgets.filterWidget.zoomError.noFeatures',
                            autoDismiss: 3
                        });
                    }
                    const extent = bbox({ type: 'FeatureCollection', features });
                    // GeoJSON from WFS is delivered in EPSG:4326 (WFS 1.1.0
                    // response defaults). zoomToExtent reprojects to the
                    // current map CRS.
                    return zoomToExtent(extent, 'EPSG:4326');
                })
                .catch(() => Rx.Observable.of(showError({
                    title: 'widgets.filterWidget.zoomError.title',
                    message: 'widgets.filterWidget.zoomError.fetchFailed',
                    autoDismiss: 4
                })));
        });

/**
 * Open the layer filter editor for this filter.
 *
 * Important: this is NOT the TOC layer filter panel. The user requested that
 * clicking the "open layer filter" icon on a filter card opens the widget
 * builder, selects the matching filter inside it and opens the in-builder
 * layer filter editor (the same one reachable from the Filter Data tab via
 * the green/blue filter button on the layer field).
 *
 * Sequence:
 * 1. editWidget(widget)            → enters the widget builder for this widget
 * 2. onEditorChange selectedFilterId → focuses the targeted filter
 * 3. openFilterEditor()            → opens the per-layer filter editor
 */
export const openLayerFilterFromCardEpic = (action$, store) =>
    action$.ofType(FILTER_WIDGET_CARD_OPEN_LAYER_FILTER)
        .switchMap(({ widgetId, filterId, target }) => {
            const state = store.getState();
            const { widget, filter, layer } = findFilterAndLayer(state, widgetId, target, filterId);
            if (!widget || !filter || !layer?.id) {
                return Rx.Observable.empty();
            }
            return Rx.Observable.of(
                editWidget(widget),
                onEditorChange('selectedFilterId', filterId),
                openFilterEditor()
            );
        });

/**
 * Open the LayerDownload dialog for the filter's source layer. The current
 * filter's CQL is already applied to the layer via the interactions epic
 * (when the filter widget is plugged), so the dialog's "Download filtered
 * dataset" option will pick it up.
 */
export const exportFilteredDataFromCardEpic = (action$, store) =>
    action$.ofType(FILTER_WIDGET_CARD_EXPORT)
        .switchMap(({ widgetId, filterId, target }) => {
            const state = store.getState();
            const { layer } = findFilterAndLayer(state, widgetId, target, filterId);
            if (!layer?.id) {
                return Rx.Observable.empty();
            }
            return Rx.Observable.of(download(layer));
        });

export default {
    zoomToFilteredFeaturesEpic,
    openLayerFilterFromCardEpic,
    exportFilteredDataFromCardEpic
};
