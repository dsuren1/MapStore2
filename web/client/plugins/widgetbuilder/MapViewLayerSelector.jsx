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
import { Glyphicon } from 'react-bootstrap';
import castArray from 'lodash/castArray';
import isEmpty from 'lodash/isEmpty';

import Message from '../../components/I18N/Message';
import BorderLayout from '../../components/layout/BorderLayout';
import FlexBox, { FlexFill } from '../../components/layout/FlexBox';
import Button from '../../components/layout/Button';
import ResourceCard from '../../components/catalog/resources/ResourceCard';
import InputControl from '../../components/catalog/resources/InputControl';
import Toolbar from '../../components/widgets/builder/wizard/common/layerselector/Toolbar';
import BuilderHeader from './BuilderHeader';
import { layersSelector } from '../../selectors/layers';
import { isInteractionSupported } from '../../utils/InteractionUtils';
import '../../components/catalog/datasets/Catalog.less';


const withBackButton = ({ toggleLayerSelector } = {}) => [{
    glyph: 'arrow-left',
    tooltipId: 'widgets.builder.wizard.backToChartOptionConfiguration',
    onClick: () => toggleLayerSelector(false)
}];

const selector = createStructuredSelector({
    mapLayers: (state) => (layersSelector(state) || []).filter(isInteractionSupported)
});

// Local search filter on layer title / name / description
const filterLayers = (layers, text) => {
    if (!text) return layers;
    const t = text.toLowerCase();
    return layers.filter((l) => {
        const title = (l.title && (typeof l.title === 'string' ? l.title : l.title.default)) || '';
        return [title, l.name, l.description]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(t));
    });
};

const MapLayerSelector = connect(selector)(({
    onClose = () => {},
    onLayerChoice = () => {},
    showLayers,
    toggleLayerSelector,
    mapLayers = []
}) => {
    // Filter widget on the map can target a single layer at a time.
    const [selectedId, setSelectedId] = useState(null);
    const [searchText, setSearchText] = useState('');

    const filteredLayers = useMemo(
        () => filterLayers(mapLayers, searchText),
        [mapLayers, searchText]
    );

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

    const getLayerTitle = (layer) =>
        (typeof layer.title === 'string' ? layer.title : layer.title?.default) || layer.name;

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
            <FlexBox
                column
                className="ms-map-layer-selector ms-catalog list"
                classNames={["_relative", "_fill"]}
            >
                <FlexBox gap="sm" classNames={['_padding-sm']} column>
                    <FlexBox
                        className="ms-resources-search-field"
                        gap="xs"
                        centerChildrenVertically
                    >
                        <InputControl
                            className="ms-catalog-search-input"
                            placeholder="catalog.search"
                            debounceTime={300}
                            value={searchText}
                            onChange={(value) => setSearchText(value)}
                        />
                        <Button square borderTransparent disabled>
                            <Glyphicon glyph="search" />
                        </Button>
                        {searchText ? (
                            <Button
                                square
                                borderTransparent
                                onClick={() => setSearchText('')}
                            >
                                <Glyphicon glyph="1-close" />
                            </Button>
                        ) : null}
                    </FlexBox>
                </FlexBox>

                <FlexFill flexBox className="ms-catalog-main-content">
                    <FlexFill flexBox column className="_relative ms-catalog-results-panel">
                        <FlexBox classNames={['_padding-sm']} centerChildrenVertically>
                            <strong>
                                <Message msgId="layers" /> ({filteredLayers.length})
                            </strong>
                        </FlexBox>
                        {mapLayers.length === 0 ? (
                            <div className="text-muted" style={{ padding: 16, textAlign: 'center' }}>
                                <Glyphicon glyph="info-sign" style={{ marginRight: 6 }} />
                                <Message msgId="widgets.builder.wizard.noFilterableMapLayers" />
                            </div>
                        ) : filteredLayers.length === 0 ? (
                            <div className="text-muted _padding-sm">
                                <Message msgId="catalog.noRecordsMatched" />
                            </div>
                        ) : (
                            <FlexFill component="ul" flexBox className="ms-catalog-list _relative _padding-sm">
                                {filteredLayers.map((layer) => {
                                    const title = getLayerTitle(layer);
                                    const isChecked = selectedId === layer.id;
                                    return (
                                        <li
                                            key={layer.id}
                                            className="ms-catalog-card"
                                        >
                                            <ResourceCard
                                                data={{
                                                    ...layer,
                                                    '@extras': {
                                                        info: {
                                                            icon: { glyph: 'dataset' },
                                                            title
                                                        }
                                                    }
                                                }}
                                                layoutCardsStyle="grid"
                                                active={isChecked}
                                                onClick={() => toggleSelect(layer)}
                                                metadata={[
                                                    { path: '@extras.info.title', target: 'header' },
                                                    { path: 'name', target: 'body' },
                                                    { path: '@extras.info.description', target: 'body', ellipsis: false }
                                                ]}
                                                buttons={[{
                                                    name: 'addToFilter',
                                                    Component: (props) => (
                                                        <Button
                                                            {...props}
                                                            className="square-button-md"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleSelect(layer);
                                                            }}
                                                        >
                                                            <Glyphicon glyph={isChecked ? 'ok' : 'plus'} />
                                                        </Button>
                                                    )
                                                }]}
                                            />
                                        </li>
                                    );
                                })}
                            </FlexFill>
                        )}
                    </FlexFill>
                </FlexFill>
            </FlexBox>
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
