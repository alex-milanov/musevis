'use strict';

// dom
const {div, section, button, svg, span, h1, h} = require('iblokz/adapters/vdom');
// components
const counter = require('./counter');

module.exports = ({state, actions}) => section('.app', [
	h1('xAmp Prototype'),
	h('audio#song', {attrs: {src: 'assets/LatinEthnoElektroGroove.mp3', controls: true}}),
	h('svg', {attrs: {width: 640, height: 240}})
]);
