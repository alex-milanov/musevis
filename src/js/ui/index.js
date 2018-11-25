'use strict';

// dom
const {div, section, button, svg, img, span, h1, h, i} = require('iblokz-snabbdom-helpers');

const controls = require('./controls');

module.exports = ({state, actions}) => section('.app', [
	controls({state, actions}),
	img('.logo[src="assets/img/logo.png"][width="48"]'),
	h('audio#song', {attrs: {src: 'assets/LatinEthnoElektroGroove.mp3', controls: true}}),
	h('svg#scene', {attrs: {width: 780, height: 520}}),
	button('.playpause', {
		on: {click: () => actions.toggle('playing')}
	}, [
		i('.fa', {
			class: {
				'fa-play': !state.playing,
				'fa-pause': state.playing
			}
		})
	])
]);
