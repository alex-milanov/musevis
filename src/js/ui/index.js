'use strict';

// dom
const {div, section, button, svg, span, h1, h, i} = require('iblokz/adapters/vdom');
// components
const counter = require('./counter');

module.exports = ({state, actions}) => section('.app', [
	h1('_ Musevis'),
	h('audio#song', {attrs: {src: 'assets/LatinEthnoElektroGroove.mp3', controls: true}}),
	h('svg', {attrs: {width: 780, height: 560}}),
	button('.playpause', [
		i('.fa.fa-play')
	])
]);
