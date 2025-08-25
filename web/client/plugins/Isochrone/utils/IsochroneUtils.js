import uuid from 'uuid';
import _bbox from '@turf/bbox';
import difference from '@turf/difference';
import { BUCKET_COLORS, CONTROL_NAME, ISOCHRONE_ROUTE_LAYER } from '../constants';

const computeIsochroneBands = (features) => {
    const result = [];

    for (let i = 0; i < features.length; i++) {
        let current = features[i];

        // subtract only the previous polygon (faster, works for concentric isochrones)
        if (i > 0) {
            const diff = difference(current, features[i - 1]);
            if (diff) {
                current = diff;
            }
        }

        result.push(current);
    }
    return result;
};

/**
 * Generates isochrone layer from data
 * @param {object[]} data - The data to generate the isochrone layer from
 * @param {object} config - The config to generate the isochrone layer from
 * @returns {object} The isochrone layer
 */
export const getIsochroneLayer = (data = [], config = {}) => {
    const features = data.map((feature, index)=> ({
        type: 'Feature',
        geometry: feature.geometry,
        properties: {
            id: `isochrone-polygon-${index}`
        }
    }));
    const layer = {
        type: 'vector',
        id: uuid(),
        name: ISOCHRONE_ROUTE_LAYER,
        title: CONTROL_NAME,
        visibility: true,
        features: computeIsochroneBands(features),
        style: {
            format: 'geostyler',
            body: {
                rules: features.map((_, index) => ({
                    filter: [ '==', 'id', `isochrone-polygon-${index}` ],
                    mandatory: true,
                    symbolizers: [{
                        kind: 'Fill',
                        color: BUCKET_COLORS[index] || BUCKET_COLORS[BUCKET_COLORS.length - 1],
                        fillOpacity: 0.7,
                        outlineColor: "#8c8e89",
                        outlineOpacity: 1,
                        outlineWidth: 2
                    }]
                }))
            }
        }
    };
    const bbox = _bbox({ type: "FeatureCollection", features });
    return {
        layer,
        bbox,
        data: { layer, bbox, config }
    };
};
