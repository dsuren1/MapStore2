/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, {useEffect, useState} from 'react';
import ReactSelect from "react-select";
import { FormControl, Glyphicon } from "react-bootstrap";
import isEmpty from "lodash/isEmpty";
import get from "lodash/get";

import localizedProps from "../../../../misc/enhancers/localizedProps";
import Message from "../../../../I18N/Message";
import Button from "../../../../misc/Button";
const Select = localizedProps(["noResultsText"])(ReactSelect);

/**
 * Map switcher component
 */
export default ({
    maps = [],
    onChange = () => {},
    value = '',
    disabled = false,
    className = '',
    editorData = {},
    setSelectedMap = () => {},
    withContainer = false,
    selectedMap = {}
}) => {
    const renderMapSwitchSelector = (options) => {
        if (options.length === 1) {
            return null;
        }
        return (<Select
            style={{width: 180}}
            className={className}
            disabled={disabled}
            noResultsText="widgets.mapSwitcher.noResults"
            options={isEmpty(options)
                ? []
                : options.map(m => ({
                    label: m.name,
                    value: m.mapId
                }))
            }
            onChange={(val) => val.value && onChange("selectedMapId", val.value)}
            value={value || options?.[0]?.mapId}
            clearable={false}
        />);
    };

    if (!withContainer) {
        return renderMapSwitchSelector(maps);
    }

    const [emptyMap, setEmptyMap] = useState(false);
    const [emptyMapName, setEmptyMapName] = useState('');
    useEffect(() => {
        if (!isEmpty(editorData?.maps) && withContainer) {
            const containsEmptyMap =  editorData?.maps?.some(map => isEmpty(map.name));
            let selected;
            if (containsEmptyMap) {
                setEmptyMap(true);
                selected = editorData.maps?.find(map => isEmpty(map.name));
            } else {
                setEmptyMap(false);
                selected = get(editorData, 'maps[0]', {});
                if (!isEmpty(editorData.selectedMapId)) {
                    selected = editorData.maps?.find(m => m.mapId === editorData.selectedMapId);
                } else {
                    onChange("selectedMapId", selected.mapId);
                }
            }
            setSelectedMap(selected);
        }
    }, [
        editorData.maps,
        editorData.selectedMapId,
        withContainer,
        setSelectedMap,
        onChange]
    );

    return (emptyMap || editorData.maps?.length > 1)
        ? (<div className="widget-map-selector">
            <div className="widget-map-selector-label">
                <strong>
                    <Message msgId={`widgets.mapSwitcher.${emptyMap ? "formLabel" : "selectLabel"}`} />
                </strong>
            </div>
            {emptyMap ?
                <div style={{ display: 'inline-flex'}}>
                    <FormControl
                        type="text"
                        style={{
                            textOverflow: "ellipsis"
                        }}
                        value={emptyMapName}
                        onChange={(e) => setEmptyMapName(e.target.value)}/>
                    <Button
                        bsStyle="primary"
                        disabled={!emptyMapName}
                        onClick={()=> {
                            onChange(`maps[${selectedMap.mapId}].name`, emptyMapName);
                            onChange("selectedMapId", selectedMap.mapId);
                        }}
                    >
                        <Glyphicon glyph="ok"/>
                    </Button>
                </div>
                : renderMapSwitchSelector(editorData.maps)
            }
        </div>) : null;
};
