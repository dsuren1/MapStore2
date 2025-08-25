/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import PropTypes from "prop-types";
import React from "react";
import { Glyphicon } from "react-bootstrap";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";

import { createPlugin } from "../../utils/PluginsUtils";
import usePluginItems from "../../hooks/usePluginItems";
import Message from "../../components/I18N/Message";
import { setControlProperty, toggleControl } from "../../actions/controls";
import { mapLayoutValuesSelector } from "../../selectors/maplayout";

import { CONTROL_NAME } from "./constants";
import * as epics from "./epics/isochrone";
import {
    enabledSelector,
    isochroneDataSelector,
    isochroneLoadingSelector,
    isochroneLocationSelector,
    searchLoadingSelector,
    searchResultsSelector
} from "./selectors/isochrone";
import {
    addAsLayer,
    resetIsochrone,
    searchByLocationName,
    selectLocationFromMap,
    setIsochroneError,
    setIsochroneLoading,
    triggerIsochroneRun,
    updateLocation
} from "./actions/isochrone";
import isochrone from "./reducers/isochrone";
import IsochroneContainer from "./containers/Isochrone";
import { mergeOptionsByOwner } from "../../actions/additionallayers";

const Isochrone = ({
    items,
    ...props
}, context) => {

    const { loadedPlugins } = context;
    const configuredItems = usePluginItems({ items, loadedPlugins });

    return (
        <IsochroneContainer
            {...props}
            configuredItems={configuredItems}
        />
    );
};

Isochrone.contextTypes = {
    loadedPlugins: PropTypes.object
};

const isochroneConnect = connect(
    createStructuredSelector({
        active: enabledSelector,
        dockStyle: state => mapLayoutValuesSelector(state, { height: true, right: true }, true),
        searchResults: searchResultsSelector,
        searchLoading: searchLoadingSelector,
        location: isochroneLocationSelector,
        isochroneData: isochroneDataSelector,
        isochroneLoading: isochroneLoadingSelector
    }),
    {
        onActive: setControlProperty.bind(null, CONTROL_NAME, "enabled"),
        onIsochroneRun: triggerIsochroneRun,
        onSearchByLocationName: searchByLocationName,
        onUpdateLocation: updateLocation,
        onSelectLocationFromMap: selectLocationFromMap,
        onSetLoading: setIsochroneLoading,
        onAddAsLayer: addAsLayer,
        onResetIsochrone: resetIsochrone,
        onError: setIsochroneError,
        onLayerPropertyChange: mergeOptionsByOwner
    }
);

const IsochroneComponent = isochroneConnect(Isochrone);

IsochroneComponent.propTypes = {
    items: PropTypes.array
};

export default createPlugin(
    'Isochrone',
    {
        options: {
            disablePluginIf: "{state('mapType') === 'leaflet'}"
        },
        component: IsochroneComponent,
        epics,
        reducers: {
            isochrone
        },
        containers: {
            SidebarMenu: {
                position: 2100,
                priority: 1,
                doNotHide: true,
                name: 'isochrone',
                text: <Message msgId="isochrone.title"/>,
                tooltip: "isochrone.tooltip",
                icon: <Glyphicon glyph="1-point-dashed" />,
                action: () => toggleControl(CONTROL_NAME),
                selector: (state) => {
                    return {
                        bsStyle: enabledSelector(state) ? 'primary' : 'tray',
                        active: enabledSelector(state) || false
                    };
                }
            }
        }
    }
);
