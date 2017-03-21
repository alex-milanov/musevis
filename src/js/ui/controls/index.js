'use strict';

// dom
const {div, section, select, option, button, svg, img, span, h1, h, i} = require('iblokz-snabbdom-helpers');

const visList = [
	'circles',
	'bars'
];

module.exports = ({state, actions}) => section('.controls', [
	select({
		on: {
			change: ev => actions.set('vis', ev.target.value)
		}
	}, visList.map(vis =>
		option(`[value="${vis}"]`, {
			attrs: {
				selected: vis === state.vis
			}
		}, vis)
	))
]);
