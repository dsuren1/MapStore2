/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const CONTROL_NAME = 'isochrone';
export const DEFAULT_PROVIDER = 'graphhopper';
export const DRAGGABLE_CONTAINER_ID = 'isochrone-container';
export const ISOCHRONE_ROUTE_LAYER = 'isochrone-route';

export const GRAPHHOPPER_PROVIDER_URL = 'https://graphhopper.com/api/1/isochrone';

export const DEFAULT_ISOCHRONE_CONFIG = {
    profile: 'car',
    distance_limit: 900,
    reverse_flow: false, // default is departure
    buckets: 10
};

export const DEFAULT_PROFILE_OPTIONS = [
    { value: 'foot', glyph: 'male' },
    { value: 'car', glyph: 'car' }
];

export const DEFAULT_RANGE_OPTIONS = [
    { value: 'distance', label: 'Distance', glyph: '1-ruler' },
    { value: 'time', label: 'Time', glyph: 'time' }
];

export const DIRECTION_OPTIONS = ['departure', 'arrival'];
export const RANGE = {
    DISTANCE: 'distance',
    TIME: 'time'
};

export const BUCKET_COLORS = ["#78b874", "#a1b7d4", "#c7eac2", "#f8cdf6", "#8d8bc0", "#ffda97", "#c59de4", "#cf9c98", "#70b36b", "#a1b7d4"];
