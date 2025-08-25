/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef, useState, useCallback, useMemo } from 'react';
import uuid from 'uuid';

import FlexBox from '../../../components/layout/FlexBox';
import ResponsivePanel from '../../../components/misc/panels/ResponsivePanel';
import Message from '../../../components/I18N/Message';
import { DEFAULT_PANEL_WIDTH } from '../../../utils/LayoutUtils';
import { DEFAULT_PROVIDER, DRAGGABLE_CONTAINER_ID } from '../constants';
import GraphHopperProvider from '../components/Provider/GraphHopper';
import Waypoints from '../../../components/search/geosearchpicker';
import Text from '../../../components/layout/Text';
import IsochroneAction from '../components/IsochroneAction';
import LoadingView from '../../../components/misc/LoadingView';
import RouteDetail from '../components/RouteDetail';

const defaultProviders = { [DEFAULT_PROVIDER]: GraphHopperProvider };
const getDefaultWaypoints = () => [{value: null, id: uuid()}];

const IsochroneContainer = ({
    active,
    configuredItems,
    providerName = DEFAULT_PROVIDER,
    width = DEFAULT_PANEL_WIDTH,
    dockStyle,
    location,
    config,
    searchResults,
    searchLoading,
    isochroneLoading,
    isochroneData,
    onSetLoading,
    onSearchByLocationName,
    onIsochroneRun,
    onActive,
    onUpdateLocation,
    onSelectLocationFromMap,
    onAddAsLayer,
    onResetIsochrone,
    onLayerPropertyChange,
    onError
}) => {

    const availableProviders = {
        ...defaultProviders,
        ...Object.fromEntries(
            configuredItems
                .filter(({ target }) => target === 'provider')
                .map((item) => [item.name, item.Component])
        )
    };

    const apiRegister = useRef({});

    const registerApi = useCallback((name, providerAPI) => {
        apiRegister.current[name] = providerAPI;
    }, []);

    const SelectedProvider = availableProviders[providerName];

    const selectedApi = apiRegister.current[providerName];

    const [editing, setEditing] = useState([]);

    const isEditing = useMemo(() => editing.some((e) => e), [editing]);

    const handleRun = useCallback(() => {
        if (selectedApi) {
            onSetLoading(true);
            selectedApi
                .getDirections(location)
                .then(onIsochroneRun)
                .catch(onError)
                .finally(() => onSetLoading(false));
        }
    }, [selectedApi, location, onIsochroneRun]);

    const [waypoints, setWaypoints] = useState(getDefaultWaypoints());

    const handleReset = () => {
        onResetIsochrone();
        setWaypoints(getDefaultWaypoints());
    };

    const handleClose = () => {
        onActive(false);
        handleReset();
    };

    return (
        <ResponsivePanel
            dock
            containerStyle={dockStyle}
            containerId="isochrone"
            containerClassName={active ? 'isochrone-active' : ''}
            open={active}
            size={width}
            position="right"
            bsStyle="primary"
            title={<Message msgId="isochrone.title" />}
            onClose={handleClose}
            glyph="1-point-dashed"
            style={dockStyle}
        >
            {isEditing || isochroneLoading ? (
                <div className="editing-overlay">
                    {isEditing ? (
                        <Text className="edit-text" fontSize={"lg"}>
                            <Message msgId="isochrone.clickOnMap" />
                        </Text>
                    ) : <LoadingView />}
                </div>
            ) : null}
            <FlexBox column gap="md" classNames={['_padding-md']}>
                <Waypoints
                    containerId={DRAGGABLE_CONTAINER_ID}
                    waypoints={waypoints}
                    locations={[location]}
                    items={[]}
                    isDraggable={false}
                    searchResults={searchResults}
                    searchLoading={searchLoading}
                    onSetWaypoints={setWaypoints}
                    onUpdateLocations={(locations) => onUpdateLocation(locations[0])}
                    onSelectLocationFromMap={onSelectLocationFromMap}
                    onSearchByLocationName={onSearchByLocationName}
                    onToggleCoordinateEditor={setEditing}
                />
                <div className="isochrone-divider" />
                {SelectedProvider ? <SelectedProvider registerApi={registerApi} config={config} /> : null}
                <IsochroneAction loading={isochroneLoading} onHandleRun={handleRun} onHandleReset={handleReset} />
                <div className="isochrone-divider" />
                <RouteDetail
                    isochroneData={isochroneData}
                    onAddAsLayer={onAddAsLayer}
                    onLayerPropertyChange={onLayerPropertyChange}
                />
            </FlexBox>
        </ResponsivePanel>
    );
};

export default IsochroneContainer;
