/*
 * Copyright 2015, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const PropTypes = require('prop-types');
const Legend = require('./legend/Legend');

class WMSLegend extends React.Component {
    static propTypes = {
        node: PropTypes.object,
        legendContainerStyle: PropTypes.object,
        legendStyle: PropTypes.object,
        showOnlyIfVisible: PropTypes.bool,
        currentZoomLvl: PropTypes.number,
        scales: PropTypes.array,
        WMSLegendOptions: PropTypes.string,
        scaleDependent: PropTypes.bool
    };

    static defaultProps = {
        legendContainerStyle: {},
        showOnlyIfVisible: false,
        scaleDependent: true
    };

    render() {
        let node = this.props.node || {};
        console.log("this.node", this.props)
        if (this.canShow(node) && node.type === "wms" && node.group !== "background") {
            return (
                <div style={this.props.legendContainerStyle}>
                    <Legend
                        style={this.props.legendStyle}
                        layer={node}
                        currentZoomLvl={this.props.currentZoomLvl}
                        scales={this.props.scales}
                        legendHeigth={this.props.node.legendOptions && this.props.node.legendOptions.legendHeight}
                        legendWidth={this.props.node.legendOptions && this.props.node.legendOptions.legendWidth}
                        legendOptions={this.props.WMSLegendOptions}
                        scaleDependent={this.props.scaleDependent}/>
                </div>
            );
        }
        return null;
    }

    canShow = (node) => {
        return node.visibility || !this.props.showOnlyIfVisible;
    };
}

module.exports = WMSLegend;
