/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { isFilterEmpty, isFilterGlobal, getFilterWidgetIds } from '../../../utils/FilterUtils';

const getWidgetTitle = (widgetId, filterWidgets) =>
    (filterWidgets || []).find((widget) => widget.id === widgetId)?.title || widgetId;

const FilterNodeTool = ({
    node,
    onChange,
    itemComponent,
    config
}) => {
    const ItemComponent = itemComponent;
    const { layerFilter } = node || {};
    if (isFilterEmpty(layerFilter) || !ItemComponent) {
        return null;
    }
    const { disabled } = layerFilter || {};
    const isGlobal = isFilterGlobal(layerFilter);
    const widgetIds = getFilterWidgetIds(layerFilter);
    const isWidgetOnly = !isGlobal && widgetIds.length > 0;
    const widgets = widgetIds.map((widgetId) => getWidgetTitle(widgetId, config?.layerOptions?.filterWidgets)).join(', ');

    const tooltipId = isWidgetOnly
        ? (!disabled ? 'toc.filterWidgetIconEnabled' : 'toc.filterWidgetIconDisabled')
        : widgetIds.length > 0
            ? (!disabled ? 'toc.filterAndWidgetIconEnabled' : 'toc.filterAndWidgetIconDisabled')
            : (!disabled ? 'toc.filterIconEnabled' : 'toc.filterIconDisabled');

    return (
        <ItemComponent
            glyph={isWidgetOnly ? 'filter-widget' : 'filter'}
            active={!disabled}
            tooltipId={tooltipId}
            tooltipParams={{ widgets }}
            onClick={() => {
                onChange({ layerFilter: { ...layerFilter, disabled: !layerFilter.disabled }});
            }}
        />
    );
};

export default FilterNodeTool;
