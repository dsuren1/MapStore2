/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { withPropsOnChange } from 'recompose';
import { isEqual } from 'lodash';
import { ZOOM_TO_EXTENT_HOOK } from '../../../utils/MapUtils';

/**
 * Reacts to a `zoomToRequest` set on one of this map widget's `maps[]` entries (by the
 * filter widget zoomTo interaction epic) and triggers this widget's local map zoom hook.
 * Complements `dependenciesToExtent`, but is driven directly by the interactions system
 * instead of the legacy dependenciesMap/mapSync wiring, so it requires no connection setup.
 */
export default withPropsOnChange(
    (props = {}, nextProps = {}) => {
        const next = (nextProps.maps || []).find(m => m?.zoomToRequest);
        const current = (props.maps || []).find(m => m?.mapId === next?.mapId);
        return !!next && !isEqual(current?.zoomToRequest, next.zoomToRequest);
    },
    ({ id, maps = [], updateProperty = () => {}, hookRegister }) => {
        const targetMap = maps.find(m => m?.zoomToRequest);
        if (!targetMap) {
            return {};
        }
        const hook = hookRegister?.getHook(ZOOM_TO_EXTENT_HOOK);
        if (hook) {
            const { extent, crs, maxZoom } = targetMap.zoomToRequest;
            hook(extent, { crs, maxZoom });
        }
        updateProperty(id, 'maps', { mapId: targetMap.mapId, zoomToRequest: undefined }, 'merge');
        return {};
    }
);
