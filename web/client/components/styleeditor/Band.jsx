/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Message from '../I18N/Message';
import Select from 'react-select';
import PropertyField from './PropertyField';
import numberLocalizer from 'react-widgets/lib/localizers/simple-number';
numberLocalizer();
import { NumberPicker as NP } from 'react-widgets';
import localizeProps from '../misc/enhancers/localizedProps';
const NumberPicker = localizeProps("placeholder")(NP);

function Band({
    label = 'styleeditor.band',
    value,
    bands,
    onChange,
    enhancementType,
    vendorOption
}) {
    return (
        <>
            <PropertyField
                label={label}>
                <Select
                    clearable={false}
                    options={bands}
                    value={value}
                    onChange={option => onChange('band', option.value)}
                />
            </PropertyField>
            <PropertyField
                label="styleeditor.contrastEnhancement">
                <Select
                    clearable={false}
                    options={[
                        {
                            label: <Message msgId="styleeditor.none" />,
                            value: 'none'
                        },
                        {
                            label: <Message msgId="styleeditor.normalize" />,
                            value: 'normalize'
                        },
                        {
                            label: <Message msgId="styleeditor.histogram" />,
                            value: 'histogram'
                        }
                    ]}
                    value={enhancementType || 'none'}
                    onChange={option => {
                        const newEnhancementType = option.value === 'none'
                            ? undefined
                            : option.value;
                        onChange('enhancementType', newEnhancementType);
                    }}
                />
            </PropertyField>
            {enhancementType === 'normalize' &&
            <>
                <PropertyField
                    label={'styleeditor.vendorOption.algorithm'}>
                    <Select
                        clearable={false}
                        options={[
                            {
                                label: <Message msgId="styleeditor.stretchToMinimumMaximum" />,
                                value: 'StretchToMinimumMaximum'
                            },
                            {
                                label: <Message msgId="styleeditor.clipToMinimumMaximum" />,
                                value: 'ClipToMinimumMaximum'
                            },
                            {
                                label: <Message msgId="styleeditor.clipToZero" />,
                                value: 'ClipToZero'
                            }
                        ]}
                        value={vendorOption?.algorithm}
                        onChange={option => onChange('algorithm', option.value)}
                    />
                </PropertyField>
                <PropertyField
                    label={'styleeditor.vendorOption.values'}>
                    <NumberPicker
                        placeholder={"styleeditor.vendorOption.minValue"}
                        format="- ###.###"
                        value={vendorOption?.minValue}
                        onChange={val => onChange('minValue', val)}
                    />
                    <NumberPicker
                        placeholder={"styleeditor.vendorOption.maxValue"}
                        format="- ###.###"
                        value={vendorOption?.maxValue}
                        onChange={val => onChange('maxValue', val)}
                    />
                </PropertyField>
            </>
            }
        </>
    );
}

export default Band;
