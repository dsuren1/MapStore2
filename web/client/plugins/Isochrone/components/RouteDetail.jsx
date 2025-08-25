import React from 'react';
import isNil from 'lodash/isNil';
import { DropdownButton, Glyphicon, MenuItem } from 'react-bootstrap';

import FlexBox from '../../../components/layout/FlexBox';
import VisibilityCheck from '../../TOC/components/VisibilityCheck';
import Text from '../../../components/layout/Text';
import { download } from '../../../utils/FileUtils';
import Message from '../../../components/I18N/Message';
import { CONTROL_NAME } from '../constants';
import { getCenterForExtent } from '../../../utils/MapUtils';
import OpacitySlider from '../../TOC/components/OpacitySlider';

const getLayerText = (bbox, config) => {
    const {x, y} = getCenterForExtent(bbox, "EPSG:4326");
    const distance = config.distance_limit;
    const time = config.time_limit;
    const isDistance = !isNil(distance);
    let range;
    if (isDistance) {
        range = `Distance: ${Number(distance) / 1000} km`;
    } else if (time) {
        range = `Time: ${Number(time) / 60} min`;
    }
    return `Lat: ${x.toFixed(2)}, Lon: ${y.toFixed(2)} | ${range}`;
};

const RouteDetail = ({
    isochroneData = [],
    onLayerPropertyChange = () => {},
    onAddAsLayer = () => {}
}) => {

    const exportGeoJSON = (layer) => {
        download(
            JSON.stringify({
                type: 'FeatureCollection',
                msType: CONTROL_NAME,
                features: layer.features ?? []
            }),
            `${layer.name}.json`,
            'application/geo+json'
        );
    };

    const onPropertyChange = (index, options) => {
        onLayerPropertyChange(CONTROL_NAME + `_run_${index + 1}`, options);
    };

    return (
        <FlexBox.Fill column flexBox gap="sm" className="isochrone-route-detail">
            {isochroneData.map((data, index) => {
                const { layer, bbox, config } = data;
                return (
                    <FlexBox.Fill flexBox className="layer-container">
                        <FlexBox className="layer-header-container">
                            <FlexBox.Fill flexBox className="layer-header" gap="sm">
                                <VisibilityCheck
                                    value={layer.visibility}
                                    onChange={(value) => onPropertyChange(index, {"visibility": value})} />
                                <FlexBox gap="sm" centerChildrenVertically>
                                    <Glyphicon glyph="1-layer" />
                                    <Text fontSize="sm">{getLayerText(bbox, config)}</Text>
                                </FlexBox>
                            </FlexBox.Fill>
                            <DropdownButton
                                noCaret
                                pullRight
                                title={<Glyphicon glyph="option-vertical" />}
                                className="isochrone-options square-button-md"
                            >
                                <MenuItem onClick={() => exportGeoJSON(layer)}>
                                    <Message msgId="isochrone.exportAsGeoJSON" />
                                </MenuItem>
                                <MenuItem onClick={() => onAddAsLayer({...layer})}>
                                    <Message msgId="isochrone.addAsLayer" />
                                </MenuItem>
                            </DropdownButton>
                        </FlexBox>
                        <div
                            className="mapstore-slider with-tooltip"
                            onClick={(e) => { e.stopPropagation(); }}>
                            <OpacitySlider
                                opacity={layer.opacity}
                                onChange={(value) => onPropertyChange(index, {"opacity": value})} />
                        </div>
                    </FlexBox.Fill>
                );
            })}
        </FlexBox.Fill>
    );
};

export default RouteDetail;
