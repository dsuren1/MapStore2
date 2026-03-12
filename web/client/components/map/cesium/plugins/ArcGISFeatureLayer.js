/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Layers from '../../../../utils/cesium/Layers';
import * as Cesium from 'cesium';
import isEqual from 'lodash/isEqual';
import trimEnd from 'lodash/trimEnd';

import {
    getStyle,
    layerToGeoStylerStyle
} from '../../../../utils/VectorStyleUtils';
import { applyDefaultStyleToVectorLayer } from '../../../../utils/StyleUtils';
import GeoJSONStyledFeatures from '../../../../utils/cesium/GeoJSONStyledFeatures';
import TiledBillboardCollection from '../../../../utils/cesium/TiledBillboardCollection';
import axios from '../../../../libs/ajax';

const buildQueryUrl = (options) => {
    const baseUrl = trimEnd(options.url, '/');
    const layerId = options.name !== undefined ? options.name : '0';
    return `${baseUrl}/${layerId}/query`;
};

const DEFAULT_PAGE_SIZE = 1000;

const fetchAllPages = (url, baseParams, authSourceId, pageSize) => {
    const recordCount = pageSize || DEFAULT_PAGE_SIZE;
    const allFeatures = [];
    const seenIds = new Set();
    const fetchPage = (offset) => {
        return axios.get(url, {
            params: { ...baseParams, resultOffset: offset, resultRecordCount: recordCount },
            _msAuthSourceId: authSourceId
        }).then(({ data }) => {
            const newFeatures = (data?.features || []).filter(f => {
                const id = f.id ?? f.properties?.OBJECTID;
                if (id !== null && id !== undefined && seenIds.has(id)) return false;
                if (id !== null && id !== undefined) seenIds.add(id);
                return true;
            });
            if (newFeatures.length) {
                allFeatures.push(...newFeatures);
            }
            const exceeded = data?.exceededTransferLimit
                || data?.properties?.exceededTransferLimit;
            if (exceeded && newFeatures.length > 0) {
                return fetchPage(offset + (data?.features?.length || 0));
            }
            return {
                type: 'FeatureCollection',
                features: allFeatures
            };
        }).catch(() => ({
            type: 'FeatureCollection',
            features: allFeatures
        }));
    };
    return fetchPage(0);
};

const getEffectiveStrategy = (options) => options?.strategy || 'tile';

const isPointGeometry = (options) => !options?.geometryType || ['Point', 'MultiPoint'].includes(options.geometryType);

const createLoader = (options) => {
    const strategy = getEffectiveStrategy(options);
    const baseParams = {
        where: '1=1',
        outFields: '*',
        outSR: 4326,
        f: 'geojson'
    };

    if (strategy === 'bbox' || strategy === 'tile') {
        return (extent) => {
            const [xmin, ymin, xmax, ymax] = extent;
            return fetchAllPages(buildQueryUrl(options), {
                ...baseParams,
                geometry: `${xmin},${ymin},${xmax},${ymax}`,
                geometryType: 'esriGeometryEnvelope',
                spatialRel: 'esriSpatialRelIntersects',
                inSR: 4326
            }, options.security?.sourceId, options.maxRecordCount).then((data) => ({ data }));
        };
    }
    return () => fetchAllPages(
        buildQueryUrl(options), baseParams, options.security?.sourceId, options.maxRecordCount
    ).then((data) => ({ data }));
};

const applyStyle = (styledFeatures, options, features) => {
    layerToGeoStylerStyle(options)
        .then((style) => {
            getStyle(applyDefaultStyleToVectorLayer({
                ...options,
                features,
                style
            }), 'cesium')
                .then((styleFunc) => {
                    styledFeatures.setStyleFunction(styleFunc);
                });
        });
};

const createLayer = (options, map) => {
    if (!options.visibility) {
        return {
            detached: true,
            styledFeatures: undefined,
            remove: () => {}
        };
    }

    let styledFeatures;
    let loader;
    let loadingBbox;
    let bboxTimeout;
    let tiledPrimitive;

    const add = () => {
        const strategy = getEffectiveStrategy(options);
        loader = createLoader(options);

        if (strategy !== 'tile') {
            styledFeatures = new GeoJSONStyledFeatures({
                features: [],
                id: options?.id,
                map,
                opacity: options.opacity,
                queryable: options.queryable === undefined || options.queryable
            });
        }

        if (strategy === 'bbox') {
            loadingBbox = () => {
                if (bboxTimeout) {
                    clearTimeout(bboxTimeout);
                    bboxTimeout = undefined;
                }
                bboxTimeout = setTimeout(() => {
                    const viewRectangle = map.camera.computeViewRectangle();
                    const cameraPitch = Math.abs(Cesium.Math.toDegrees(map.camera.pitch));
                    if (viewRectangle && cameraPitch > 60) {
                        loader([
                            Cesium.Math.toDegrees(viewRectangle.west),
                            Cesium.Math.toDegrees(viewRectangle.south),
                            Cesium.Math.toDegrees(viewRectangle.east),
                            Cesium.Math.toDegrees(viewRectangle.north)
                        ])
                            .then(({ data: collection }) => {
                                styledFeatures.setFeatures(collection.features);
                                applyStyle(styledFeatures, options, collection.features);
                            });
                    }
                }, 300);
            };
            map.camera.moveEnd.addEventListener(loadingBbox);
        } else if (strategy === 'tile') {
            const tileLoadFn = (tileDef) => loader([
                Cesium.Math.toDegrees(tileDef.rectangle.west),
                Cesium.Math.toDegrees(tileDef.rectangle.south),
                Cesium.Math.toDegrees(tileDef.rectangle.east),
                Cesium.Math.toDegrees(tileDef.rectangle.north)
            ]).then(({ data: collection }) => collection);

            tiledPrimitive = new TiledBillboardCollection({
                map,
                tileType: isPointGeometry(options) ? 'billboard' : 'feature',
                msId: options.id,
                opacity: options.opacity,
                minimumLevel: options.minimumLevel || (isPointGeometry(options) ? 17 : 0),
                maximumLevel: options.maximumLevel || (isPointGeometry(options) ? 17 : 18),
                debugTiles: false,
                queryable: options.queryable === undefined || options.queryable,
                style: options.style,
                styleOptions: isPointGeometry(options) ? undefined : options,
                tileWidth: options?.tileSize || 512,
                loadTile: tileLoadFn
            });
            tiledPrimitive.load();
        } else {
            loader()
                .then(({ data: collection }) => {
                    styledFeatures.setFeatures(collection.features);
                    applyStyle(styledFeatures, options, collection.features);
                });
        }
    };

    return {
        detached: true,
        styledFeatures,
        add,
        remove: () => {
            if (styledFeatures) {
                styledFeatures.destroy();
                styledFeatures = undefined;
            }
            if (tiledPrimitive) {
                tiledPrimitive.destroy();
                tiledPrimitive = undefined;
            }
            if (loadingBbox) {
                map.camera.moveEnd.removeEventListener(loadingBbox);
            }
        }
    };
};

Layers.registerType('arcgis-feature', {
    create: createLayer,
    update: (layer, newOptions, oldOptions, map) => {
        if (
            oldOptions.forceProxy !== newOptions.forceProxy
            || !isEqual(oldOptions.security, newOptions.security)
            || oldOptions.strategy !== newOptions.strategy
        ) {
            return createLayer(newOptions, map);
        }
        if (layer?.styledFeatures && !isEqual(newOptions.style, oldOptions.style)) {
            layerToGeoStylerStyle(newOptions)
                .then((style) => {
                    getStyle(applyDefaultStyleToVectorLayer({
                        ...newOptions,
                        features: layer?.styledFeatures?._originalFeatures,
                        style
                    }), 'cesium')
                        .then((styleFunc) => {
                            layer.styledFeatures.setStyleFunction(styleFunc);
                        });
                });
        }
        if (layer?.styledFeatures && newOptions.opacity !== oldOptions.opacity) {
            layer.styledFeatures.setOpacity(newOptions.opacity);
        }
        return null;
    }
});
