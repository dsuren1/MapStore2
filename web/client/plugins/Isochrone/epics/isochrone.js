/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Observable } from 'rxjs';
import uuid from 'uuid';
import get from 'lodash/get';
import { API } from '../../../api/searchText';
import {
    SEARCH_BY_LOCATION_NAME,
    searchResultsLoaded,
    searchError,
    SELECT_LOCATION_FROM_MAP,
    setIsochrone,
    TRIGGER_ISOCHRONE_RUN,
    ADD_AS_LAYER,
    RESET_ISOCHRONE,
    updateLocation,
    setSearchLoading
} from '../actions/isochrone';
import { UPDATE_MAP_LAYOUT, updateMapLayout } from '../../../actions/maplayout';
import { changeMousePointer, CLICK_ON_MAP, zoomToExtent } from '../../../actions/map';
import { CONTROL_NAME, ISOCHRONE_ROUTE_LAYER } from '../constants';
import { enabledSelector, isochroneLayersOwnerSelector, isochroneLocationSelector } from '../selectors/isochrone';
import { changeMapInfoState, purgeMapInfoResults } from '../../../actions/mapInfo';
import { removeAdditionalLayer, removeAllAdditionalLayers, updateAdditionalLayer } from '../../../actions/additionallayers';
import { SET_CONTROL_PROPERTY, setControlProperty, TOGGLE_CONTROL } from '../../../actions/controls';
import { wrapStartStop } from '../../../observables/epics';
import { addLayer } from '../../../actions/layers';
import { DEFAULT_PANEL_WIDTH } from '../../../utils/LayoutUtils';
import { drawerEnabledControlSelector } from '../../../selectors/controls';
import { info } from '../../../actions/notifications';
import { getAdditionalLayerFromId } from '../../../selectors/layers';

const OFFSET = DEFAULT_PANEL_WIDTH;

export const isochroneMapLayoutEpic = (action$, store) =>
    action$.ofType(UPDATE_MAP_LAYOUT)
        .filter(({source}) => enabledSelector(store.getState()) &&  source !== CONTROL_NAME)
        .map(({layout}) => {
            const action = updateMapLayout({
                ...layout,
                right: OFFSET + (layout?.boundingSidebarRect?.right ?? 0),
                boundingMapRect: {
                    ...(layout.boundingMapRect || {}),
                    right: OFFSET + (layout?.boundingSidebarRect?.right ?? 0)
                },
                rightPanel: true
            });
            return { ...action, source: CONTROL_NAME };
        });

let index = 0;
const addMarkerFeature = (latlng) => {
    return updateAdditionalLayer(
        ISOCHRONE_ROUTE_LAYER + `_marker_${index + 1}`,
        CONTROL_NAME + '_marker',
        'overlay',
        {
            type: 'vector',
            id: uuid(),
            hideLoading: true,
            visibility: true,
            features: [{
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [latlng.lng, latlng.lat]},
                properties: { id: "point" }
            }],
            style: {
                format: "geostyler",
                body: {
                    rules: [
                        {
                            filter: [ '==', 'id', 'point' ],
                            symbolizers: [
                                {
                                    kind: "Icon",
                                    image: {
                                        name: "msMarkerIcon",
                                        args: [
                                            {
                                                glyph: "chevron-down",
                                                color: "blue",
                                                shape: "circle"
                                            }
                                        ]
                                    },
                                    opacity: 1,
                                    size: 28,
                                    rotate: 0,
                                    msBringToFront: true,
                                    anchor: "bottom",
                                    msHeightReference: "none",
                                    msClampToGround: true
                                }
                            ]
                        }
                    ]
                }
            }
        }
    );
};

/**
 * Epic that handles location name search using Nominatim
 * When SEARCH_BY_LOCATION_NAME is dispatched, it:
 * 1. Debounces the search to prevent excessive API calls
 * 2. Sets loading state to true
 * 3. Performs Nominatim search
 * 4. Dispatches results or error
 * 5. Sets loading state to false
 */
export const searchByLocationNameEpic = (action$) =>
    action$.ofType(SEARCH_BY_LOCATION_NAME)
        .debounceTime(500)
        .switchMap(({ location }) => {
            if (typeof location === 'string') {
                if (!location || location?.trim() === '') {
                    return Observable.of(searchResultsLoaded([]));
                }

                const nominatimService = API.Utils.getService('nominatim');
                return Observable.defer(() =>
                    nominatimService(location, {
                        limit: 10,
                        polygon_geojson: 1,
                        format: 'json'
                    })
                )
                    .switchMap(results => Observable.of(searchResultsLoaded(results)))
                    .catch(error => Observable.of(searchError(error)))
                    .let(wrapStartStop(
                        setSearchLoading(true),
                        setSearchLoading(false)
                    ));
            }
            const { lat, lon: lng } = get(location, 'original.properties', {});
            return Observable.of(addMarkerFeature({ lat, lng }));
        });

export const onOpenIsochroneEpic = (action$, {getState}) =>
    action$.ofType(TOGGLE_CONTROL)
        .filter(({control}) => control === CONTROL_NAME && enabledSelector(getState()))
        .switchMap(() =>
            Observable.of(
                purgeMapInfoResults(),
                changeMapInfoState(false)
            )
        );

export const selectLocationFromMapEpic = (action$) =>
    action$.ofType(SELECT_LOCATION_FROM_MAP)
        .switchMap(() =>
            action$.ofType(CLICK_ON_MAP)
                .take(1)
                .switchMap(({ point }) => {
                    const { latlng } = point;
                    return Observable.of(
                        changeMousePointer('auto'),
                        updateLocation([latlng.lng, latlng.lat]),
                        addMarkerFeature(latlng)
                    );
                }).startWith(changeMousePointer('pointer'))
        );

export const onIsochroneRunEpic = (action$, store) =>
    action$.ofType(TRIGGER_ISOCHRONE_RUN)
        .switchMap(({ isochrone } = {}) => {
            index = index + 1;
            const { bbox, layer, data } = isochrone ?? {};
            const state = store.getState();
            const [lng, lat] = isochroneLocationSelector(state);
            const layerId = ISOCHRONE_ROUTE_LAYER + `_marker_` + index;
            const ownerId = CONTROL_NAME + '_marker';
            const markerLayer = getAdditionalLayerFromId(store.getState(), layerId);
            const actions = [
                updateAdditionalLayer(ISOCHRONE_ROUTE_LAYER + index, CONTROL_NAME + `_run_${index}`, 'overlay', layer),
                // add new marker layer on new run
                markerLayer ? updateAdditionalLayer(layerId, ownerId, 'overlay', markerLayer) : addMarkerFeature({lat, lng}),
                zoomToExtent(bbox, "EPSG:4326"),
                setIsochrone(data)
            ];
            if (markerLayer) {
                actions.unshift(removeAdditionalLayer({id: layerId, owner: ownerId}));
            }
            return Observable.of(...actions);
        });

export const onCloseIsochroneEpic = (action$, store) =>
    action$.ofType(SET_CONTROL_PROPERTY, RESET_ISOCHRONE)
        .filter(({control, value, type}) =>
            control === CONTROL_NAME && !value || type === RESET_ISOCHRONE)
        .switchMap(() => {
            const owners = isochroneLayersOwnerSelector(store.getState());
            return Observable.of(
                setIsochrone(null),
                updateLocation(null),
                ...owners.map(owner => removeAllAdditionalLayers(owner))
            );
        });

export const onAddRouteAsLayerEpic = (action$, store) =>
    action$.ofType(ADD_AS_LAYER)
        .switchMap(({ features, style }) => {
            return Observable.defer(() => import('@turf/bbox').then(mod => mod.default))
                .switchMap((turfBbox) => {
                    const collection = { type: 'FeatureCollection', features };
                    const bbox = turfBbox(collection);
                    const [minx, miny, maxx, maxy] = bbox || [-180, -90, 180, 90];
                    const isDrawerOpen = drawerEnabledControlSelector(store.getState());
                    return Observable.of(
                        addLayer({
                            type: 'vector',
                            id: uuid(),
                            name: ISOCHRONE_ROUTE_LAYER,
                            title: CONTROL_NAME,
                            hideLoading: true,
                            features: collection?.features || [],
                            visibility: true,
                            style: style ?? {},
                            bbox: {
                                crs: 'EPSG:4326',
                                bounds: { minx, miny, maxx, maxy }
                            }
                        }),
                        info({
                            title: 'isochrone.title',
                            message: 'isochrone.notification.infoLayerAdded'
                        }),
                        // Open the drawer indicating a new layer has been added
                        ...(!isDrawerOpen ? [setControlProperty('drawer', 'enabled', true)] : [])
                    );
                });
        });
