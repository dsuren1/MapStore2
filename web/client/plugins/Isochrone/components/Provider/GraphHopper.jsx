import React, { useCallback, useEffect, useRef, useState } from 'react';
import Select from 'react-select';
import omit from 'lodash/omit';
import { ButtonGroup, Glyphicon } from 'react-bootstrap';
import axios from '../../../../libs/ajax';

import FlexBox from '../../../../components/layout/FlexBox';
import Message from '../../../../components/I18N/Message';
import Button from '../../../../components/layout/Button';
import Text from '../../../../components/layout/Text';
import IntlNumberFormControl from '../../../../components/I18N/IntlNumberFormControl';
import Slider from '../../../../components/misc/Slider';
import {
    DEFAULT_ISOCHRONE_CONFIG,
    DEFAULT_PROFILE_OPTIONS,
    DEFAULT_PROVIDER,
    DEFAULT_RANGE_OPTIONS,
    DIRECTION_OPTIONS,
    GRAPHHOPPER_PROVIDER_URL,
    RANGE
} from '../../constants';
import { getIsochroneLayer } from '../../utils/IsochroneUtils';

const Graphhopper = ({ registerApi, config }) => {

    const [range, setRange] = useState(RANGE.DISTANCE);
    const [providerBody, setProviderBody] = useState(DEFAULT_ISOCHRONE_CONFIG);

    const providerBodyRef = useRef(providerBody);
    providerBodyRef.current = providerBody;

    // Update providerBody when config changes
    useEffect(() => {
        setProviderBody(prev => ({
            ...prev,
            ...omit(config, 'key')
        }));
    }, [config]);

    const handleProviderBodyChange = (key, value) => {
        setProviderBody(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const getDirections = useCallback((points = []) => {
        const {key, url: _url, ...rest} = config ?? {};
        const url = `${_url || GRAPHHOPPER_PROVIDER_URL}?key=${key ?? ""}`;
        const _config = { ...providerBodyRef.current };
        return axios.get(url, {
            params: {
                ...rest,
                ..._config,
                point: [...(points ?? [])].reverse().join(',')
            }
        })
            .then(({data: response}) => getIsochroneLayer(response?.polygons ?? [], _config))
            .catch((error) => {
                console.error(error);
                throw error;
            });
    }, [range]);

    useEffect(() => {
        if (registerApi) {
            registerApi(DEFAULT_PROVIDER, {
                getDirections
            });
        }
    }, [registerApi, getDirections]);

    return (
        <FlexBox column className="isochrone-provider" gap="md">
            <FlexBox gap="sm" centerChildren className="range-by-container">
                <FlexBox.Fill flexBox gap="md" centerChildrenVertically className="range-by">
                    <Text strong><Message msgId="isochrone.rangeBy" /></Text>
                    <Select
                        className="range-by-select"
                        options={DEFAULT_RANGE_OPTIONS}
                        value={range}
                        onChange={(e) => {
                            const currentRange = e.value;
                            setRange(currentRange);
                            const isDistance = currentRange === RANGE.DISTANCE;
                            setProviderBody(prev => ({
                                ...prev,
                                ...(isDistance ? {time_limit: undefined} : {distance_limit: undefined}),
                                [isDistance ? 'distance_limit' : 'time_limit']:
                                providerBody[isDistance ? 'time_limit' : 'distance_limit']
                            }));
                        }}
                        clearable={false}
                    />
                </FlexBox.Fill>
                <IntlNumberFormControl
                    type="number"
                    value={range === RANGE.DISTANCE ? providerBody.distance_limit : providerBody.time_limit}
                    step={range === RANGE.DISTANCE ? 1 : 0.1}
                    onChange={value => setProviderBody(prev => ({
                        ...prev,
                        [range === RANGE.DISTANCE ? 'distance_limit' : 'time_limit']: value
                    }))}
                />
            </FlexBox>
            <FlexBox.Fill flexBox gap="md" centerChildrenVertically className="mode-container">
                <Text strong><Message msgId="isochrone.mode" /></Text>
                <ButtonGroup className="isochrone-profile">
                    {DEFAULT_PROFILE_OPTIONS.map(option => (
                        <FlexBox
                            component={Button}
                            key={option.value}
                            centerChildren
                            className={"_relative profile-btn"}
                            variant={providerBody.profile === option.value ? 'primary' : 'default'}
                            onClick={() => handleProviderBodyChange("profile", option.value)}
                        >
                            <Glyphicon className="profile-icon" glyph={option.glyph} />
                        </FlexBox>
                    ))}
                </ButtonGroup>
            </FlexBox.Fill>
            <FlexBox.Fill flexBox gap="md" centerChildrenVertically className="direction-container">
                <Text strong><Message msgId="isochrone.direction" /></Text>
                <ButtonGroup className="isochrone-direction">
                    {DIRECTION_OPTIONS.map(option => (
                        <FlexBox
                            component={Button}
                            key={option}
                            centerChildren
                            className={"_relative direction-btn"}
                            variant={(option === 'departure' && !providerBody.reverse_flow) ||
                                (option === "arrival" && providerBody.reverse_flow) ? 'primary' : 'default'}
                            onClick={() => handleProviderBodyChange("reverse_flow", option !== 'departure')}
                        >
                            <Message msgId={`isochrone.${option}`} />
                        </FlexBox>
                    ))}
                </ButtonGroup>
            </FlexBox.Fill>
            <FlexBox.Fill flexBox gap="md" centerChildrenVertically className="bucket-container">
                <Text strong><Message msgId="isochrone.buckets" /></Text>
                <div
                    className="mapstore-slider with-tooltip"
                    onClick={(e) => { e.stopPropagation(); }}>
                    <Slider
                        step={1}
                        tooltips={[true]}
                        start={[providerBody.buckets || 1]}
                        range={{ min: 1, max: 10 }}
                        onChange={([changedValue] = []) => {
                            handleProviderBodyChange("buckets", Math.round(Number(changedValue)));
                        }}/>
                </div>
            </FlexBox.Fill>
        </FlexBox>
    );
};

export default Graphhopper;
