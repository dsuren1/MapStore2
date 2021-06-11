/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import VisualStyleEditorComponent from '../VisualStyleEditor';
import expect from 'expect';
import { Simulate, act } from 'react-dom/test-utils';
import { DragDropContext as dragDropContext } from 'react-dnd';
import testBackend from 'react-dnd-test-backend';
import { getStyleParser } from '../../../utils/VectorStyleUtils';

const VisualStyleEditor = dragDropContext(testBackend)(VisualStyleEditorComponent);

describe('VisualStyleEditor', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById('container'));
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('should render with defaults', () => {
        ReactDOM.render(<VisualStyleEditor />, document.getElementById('container'));
        const ruleEditorNode = document.querySelector('.ms-style-rules-editor');
        expect(ruleEditorNode).toBeTruthy();
    });
    it('should trigger on change when parser and code are available', (done) => {
        ReactDOM.render(<VisualStyleEditor
            format="css"
            code={`
                    @mode 'Flat';

                    * {
                        fill: #ff0000;
                    }`}
            onChange={(newCode) => {
                try {
                    expect(newCode).toBeTruthy();
                } catch (e) {
                    done(e);
                }
                done();
            }}
        />, document.getElementById('container'));
        const ruleEditorNode = document.querySelector('.ms-style-rules-editor');
        expect(ruleEditorNode).toBeTruthy();
    });
    it('should use default JSON style if available', (done) => {
        ReactDOM.render(<VisualStyleEditor
            format="css"
            code={`
                    @mode 'Flat';

                    * {
                        fill: #ff0000;
                    }`}
            defaultStyleJSON={{
                name: '',
                rules: [{
                    name: '',
                    symbolizers: [{
                        kind: 'Fill',
                        color: '#00ff00'
                    }]
                }]
            }}
            onChange={(newCode, styleJSON) => {
                try {
                    expect(styleJSON.rules[0].symbolizers[0].color).toBe('#00ff00');
                } catch (e) {
                    done(e);
                }
                done();
            }}
        />, document.getElementById('container'));
        const ruleEditorNode = document.querySelector('.ms-style-rules-editor');
        expect(ruleEditorNode).toBeTruthy();
    });
    it('should throw an error if the parser is not available', (done) => {
        ReactDOM.render(<VisualStyleEditor
            format="unknow"
            code="unknow style format"
            onError={(error) => {
                try {
                    expect(error).toEqual({ messageId: 'styleeditor.formatNotSupported', status: 400 });
                } catch (e) {
                    done(e);
                }
                done();
            }}
        />, document.getElementById('container'));
        const ruleEditorNode = document.querySelector('.ms-style-rules-editor');
        expect(ruleEditorNode).toBeTruthy();
    });
    it('should throw an error when all style are removed', (done) => {
        const DEBOUNCE_TIME = 1;
        act(() => {
            ReactDOM.render(<VisualStyleEditor
                format="css"
                code="* { fill: #ff0000; }"
                debounceTime={DEBOUNCE_TIME}
                onError={(error) => {
                    try {
                        expect(error).toEqual({ messageId: 'styleeditor.styleEmpty', status: 400 });
                    } catch (e) {
                        done(e);
                    }
                    done();
                }}
            />, document.getElementById('container'));
        });
        setTimeout(() => {
            try {
                const ruleEditorNode = document.querySelector('.ms-style-rules-editor');
                expect(ruleEditorNode).toBeTruthy();
                const buttonNodes = document.querySelectorAll('button');
                expect([...buttonNodes].map(node => node.children[0].getAttribute('class'))).toEqual([
                    'glyphicon glyphicon-undo',
                    'glyphicon glyphicon-redo',
                    'glyphicon glyphicon-1-ruler',
                    'glyphicon glyphicon-trash',
                    'glyphicon glyphicon-option-vertical'
                ]);
                act(() => {
                    Simulate.click(buttonNodes[3]);
                });
            } catch (e) {
                done(e);
            }
        }, DEBOUNCE_TIME * 10);
    });
    it('should throw an error when rule has an error', (done) => {
        const DEBOUNCE_TIME = 1;
        act(() => {
            ReactDOM.render(<VisualStyleEditor
                format="css"
                code="* { fill: #ff0000; }"
                defaultStyleJSON={{
                    rules: [
                        {
                            name: '',
                            symbolizers: [
                                {
                                    kind: 'Fill',
                                    color: '#ff0000'
                                }
                            ]
                        },
                        {
                            errorId: 'ruleErrorId'
                        }
                    ]
                }}
                debounceTime={DEBOUNCE_TIME}
                onError={(error) => {
                    try {
                        expect(error).toEqual({ messageId: 'ruleErrorId', status: 400 });
                    } catch (e) {
                        done(e);
                    }
                    done();
                }}
            />, document.getElementById('container'));
        });
    });
    it('should throw an error when classification rule is incomplete', (done) => {
        const DEBOUNCE_TIME = 1;
        act(() => {
            ReactDOM.render(<VisualStyleEditor
                format="css"
                code="* { fill: #ff0000; }"
                defaultStyleJSON={{
                    rules: [
                        {
                            name: '',
                            symbolizers: [
                                {
                                    kind: 'Fill',
                                    color: '#ff0000'
                                }
                            ]
                        },
                        {
                            kind: 'Classification'
                        }
                    ]
                }}
                debounceTime={DEBOUNCE_TIME}
                onError={(error) => {
                    try {
                        expect(error).toEqual({ messageId: 'styleeditor.incompleteClassification', status: 400 });
                    } catch (e) {
                        done(e);
                    }
                    done();
                }}
            />, document.getElementById('container'));
        });
    });
    it('should throw an error when icon symbolizer has image undefined', (done) => {
        const DEBOUNCE_TIME = 1;
        act(() => {
            ReactDOM.render(<VisualStyleEditor
                format="css"
                code="* { fill: #ff0000; }"
                defaultStyleJSON={{
                    rules: [
                        {
                            name: '',
                            symbolizers: [
                                {
                                    kind: 'Icon',
                                    image: undefined
                                }
                            ]
                        }
                    ]
                }}
                debounceTime={DEBOUNCE_TIME}
                onError={(error) => {
                    try {
                        expect(error).toEqual({ messageId: 'styleeditor.imageSrcEmpty', status: 400 });
                    } catch (e) {
                        done(e);
                    }
                    done();
                }}
            />, document.getElementById('container'));
        });
    });
    it('should throw an error when icon symbolizer has image with no format', (done) => {
        const DEBOUNCE_TIME = 1;
        act(() => {
            ReactDOM.render(<VisualStyleEditor
                format="sld"
                code={"<?xml"}
                defaultStyleJSON={{
                    name: "Base SLD1",
                    rules: [
                        {
                            name: "",
                            ruleId: "1",
                            symbolizers: [
                                {
                                    kind: "Icon",
                                    image: "https://test.com/linktoImage",
                                    opacity: 1,
                                    size: 32,
                                    rotate: 0,
                                    symbolizerId: "2"
                                }
                            ]
                        }
                    ]
                }}
                debounceTime={DEBOUNCE_TIME}
                onError={(error) => {
                    try {
                        expect(error).toEqual({ messageId: 'styleeditor.imageFormatEmpty', status: 400 });
                    } catch (e) {
                        done(e);
                    }
                    done();
                }}
            />, document.getElementById('container'));
        });
    });
    it('render visual editor with raster symbolizer for SLD', (done) => {
        const format = "sld";
        const styleJSON = {
            name: "Base SLD1",
            rules: [
                {
                    name: "Rule Title",
                    symbolizers: [
                        {
                            kind: "Raster",
                            contrastEnhancement: {
                                enhancementType: "normalize",
                                vendorOption: {
                                    algorithm: "StretchToMinimumMaximum",
                                    minValue: 1,
                                    maxValue: 50
                                }
                            }
                        }
                    ]
                }
            ]
        };
        ReactDOM.render(<VisualStyleEditor
            format={format}
            code={"<?xml"}
            defaultStyleJSON={styleJSON}
            debounceTime={1}
            onChange={(newCode) => {
                getStyleParser(format).readStyle(newCode).then((parsedStyle)=>{
                    expect(JSON.stringify(parsedStyle)).toEqual(JSON.stringify(styleJSON));
                    done();
                }).catch((e)=> done(e));
            }}
        />, document.getElementById('container'));
        const ruleEditorNode = document.querySelector('.ms-style-rules-editor');
        const symbolizerFields = document.querySelectorAll('.ms-symbolizer-field');
        expect(ruleEditorNode).toBeTruthy();
        expect(symbolizerFields.length).toBe(5);
        expect([...symbolizerFields].map(node => node.children[0].textContent)).toEqual([
            'styleeditor.grayChannel',
            'styleeditor.contrastEnhancement',
            'styleeditor.vendorOption.algorithm',
            'styleeditor.vendorOption.values',
            'styleeditor.opacity'
        ]);
    });
    it('render editor with raster symbolizer for css', (done) => {
        const format = "sld";
        const styleJSON = {
            name: "Base SLD1",
            rules: [
                {
                    name: "Rule Title",
                    symbolizers: [
                        {
                            kind: "Raster",
                            contrastEnhancement: {
                                enhancementType: "normalize",
                                vendorOption: {
                                    algorithm: "StretchToMinimumMaximum",
                                    minValue: 1,
                                    maxValue: 50
                                }
                            }
                        }
                    ]
                }
            ]
        };
        ReactDOM.render(<VisualStyleEditor
            format={format}
            code={`@mode 'Flat';
                   @styleTitle 'Base CSS';

                   * {
                     raster-channels: auto;
                     raster-opacity: 1;
                  }`
            }
            defaultStyleJSON={styleJSON}
            debounceTime={1}
            onChange={(newCode) => {
                getStyleParser(format).readStyle(newCode).then((parsedStyle)=>{
                    expect(JSON.stringify(parsedStyle)).toEqual(JSON.stringify(styleJSON));
                    done();
                }).catch((e)=> done(e));
            }}
        />, document.getElementById('container'));
        const ruleEditorNode = document.querySelector('.ms-style-rules-editor');
        const symbolizerFields = document.querySelectorAll('.ms-symbolizer-field');
        expect(ruleEditorNode).toBeTruthy();
        expect(symbolizerFields.length).toBe(5);
    });
});
