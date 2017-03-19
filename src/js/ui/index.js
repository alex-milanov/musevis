'use strict';

// dom
const {div, section, button, svg, img, span, h1, h, i} = require('iblokz-snabbdom-helpers');

module.exports = ({state, actions}) => section('.app', [
	img('.logo[src="assets/img/logo.png"][width="48"]'),
	h('audio#song', {attrs: {src: 'assets/LatinEthnoElektroGroove.mp3', controls: true}}),
	h('svg', {attrs: {width: 780, height: 560}}),
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
