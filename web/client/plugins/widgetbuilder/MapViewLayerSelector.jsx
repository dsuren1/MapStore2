/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { Glyphicon, ListGroup, ListGroupItem, Radio } from 'react-bootstrap';
import castArray from 'lodash/castArray';
import isEmpty from 'lodash/isEmpty';

import Message from '../../components/I18N/Message';
import BorderLayout from '../../components/layout/BorderLayout';
import Toolbar from '../../components/widgets/builder/wizard/common/layerselector/Toolbar';
import BuilderHeader from './BuilderHeader';
import { layersSelector } from '../../selectors/layers';
import { isInteractionSupported } from '../../utils/InteractionUtils';


const withBackButton = ({ toggleLayerSelector } = {}) => [{
    glyph: 'arrow-left',
    tooltipId: 'widgets.builder.wizard.backToChartOptionConfiguration',
    onClick: () => toggleLayerSelector(false)
}];

const selector = createStructuredSelector({
    mapLayers: (state) => (layersSelector(state) || []).filter(isInteractionSupported)
});

const MapLayerSelector = connect(selector)(({
    onClose = () => {},
    onLayerChoice = () => {},
    showLayers,
    toggleLayerSelector,
    mapLayers = []
}) => {
    // Filter widget on the map can target a single layer at a time.
    const [selectedId, setSelectedId] = useState(null);

    const selected = useMemo(
        () => mapLayers.filter(l => l.id === selectedId),
        [mapLayers, selectedId]
    );

    const canProceed = !isEmpty(selected);

    const toggleSelect = (layer) => {
        setSelectedId(prev => prev === layer.id ? null : layer.id);
    };

    const onProceed = () => {
        if (showLayers?.key === 'filter-layer') {
            const { filterId } = showLayers;
            onLayerChoice('filter-layer', { filterId, layer: castArray(selected) });
        } else {
            onLayerChoice('filter-add', selected);
        }
        toggleLayerSelector(false);
    };

    const stepButton = withBackButton({ toggleLayerSelector });

    return (
        <BorderLayout
            className="bg-body layer-selector"
            header={
                <BuilderHeader onClose={onClose}>
                    <Toolbar
                        stepButtons={stepButton}
                        canProceed={canProceed}
                        selected={canProceed}
                        onProceed={onProceed}
                    />
                </BuilderHeader>
            }
        >
            <div className="ms-map-layer-selector" style={{ padding: 8 }}>
                <h4>
                    <Message msgId="widgets.builder.wizard.selectMapLayers" />
                </h4>
                {mapLayers.length === 0 ? (
                    <div className="text-muted" style={{ padding: 16, textAlign: 'center' }}>
                        <Glyphicon glyph="info-sign" style={{ marginRight: 6 }} />
                        <Message msgId="widgets.builder.wizard.noFilterableMapLayers" />
                    </div>
                ) : (
                    <ListGroup>
                        {mapLayers.map(layer => (
                            <ListGroupItem
                                key={layer.id}
                                onClick={() => toggleSelect(layer)}
                                style={{ cursor: 'pointer' }}
                            >
                                <Radio
                                    inline
                                    name="ms-map-layer-selector-radio"
                                    checked={selectedId === layer.id}
                                    onChange={() => toggleSelect(layer)}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <strong>{layer.title || layer.name}</strong>
                                    <span className="text-muted" style={{ marginLeft: 8, fontSize: '0.85em' }}>
                                        ({layer.type})
                                    </span>
                                </Radio>
                            </ListGroupItem>
                        ))}
                    </ListGroup>
                )}
            </div>
        </BorderLayout>
    );
});

MapLayerSelector.propTypes = {
    onClose: PropTypes.func,
    onLayerChoice: PropTypes.func,
    stepButtons: PropTypes.array,
    showLayers: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
    toggleLayerSelector: PropTypes.func
};

export default MapLayerSelector;
