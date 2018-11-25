'use strict';
// lib
// rx
const Rx = require('rx');
const $ = Rx.Observable;
// d3
const d3 = require('d3');
// iblokz
const {obj} = require('iblokz-data');
// util
const time = require('../util/time');

//
const request = require('superagent');

const lights = [
	'172.31.190.226',
	'172.31.190.222',
	'172.31.190.237',
	'172.31.190.192'
	// '172.31.190.168', // 5
	// '172.31.190.156' // 6
];

const url = `http://172.31.190.222/api/rgb`;
const ws = [];
lights.forEach((ip, i) => {
	// auth
	// request.get(`http://${ip}/auth`)
	// 	.withCredentials()
	// 	.then(() => {
	ws[i] = new WebSocket(`ws://${ip}/ws`);
		// });
});

// init
const init = () => {
	const d3scene = d3.select('svg#scene');
	return d3scene;
};

const setAttr = (el, attrs) => Object.keys(attrs)
	.forEach(key => el.attr(key, attrs[key]));

function hslToRgb(h, s, l) {
	let r;
	let g;
	let b;

	if (s === 0) {
		r = g = b = l; // achromatic
	} else {
		var hue2rgb = function hue2rgb(p, q, t) {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		};

		var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}

	return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

const render = ({d3scene, state}) => obj.switch(state.vis, {
	circles: ({el, data}) => {
		el.selectAll(':not(circle)').remove();
		// scale things to fit
		let radiusScale = d3.scaleLinear().domain([0, d3.max(data.freq)]).range([0, el.attr('height') / 2 - 10]);

		let hueScale = d3.scaleLinear().domain([0, d3.max(data.freq)]).range([0, 360]);

		// update d3 chart with new data
		let circles = el.selectAll('circle').data(data.freq);

		circles.enter().append('circle');

		// circles
		// 	.attr('r', d => radiusScale(d))
		// 	.attr('cx', el.attr('width') / 2)
		// 	.attr('cy', el.attr('height') / 2)
		// 	.attr('fill', 'none')
		// 	.attr('stroke-width', 4)
		// 	.attr('stroke-opacity', 0.4)
		// 	.attr('stroke', d => d3.hsl(hueScale(d), 1, 0.5));
		setAttr(circles, {
			'r': d => radiusScale(d),
			'cx': el.attr('width') / 2,
			'cy': el.attr('height') / 2,
			'fill': 'none',
			'stroke-width': 4,
			'stroke-opacity': 0.4,
			'stroke': d => d3.hsl(hueScale(d), 1, 0.5)
		});
			// .attr({
			// 	'r': d => radiusScale(d),
			// 	'cx': el.attr('width') / 2,
			// 	'cy': el.attr('height') / 2,
			// 	'fill': 'none',
			// 	'stroke-width': 4,
			// 	'stroke-opacity': 0.4,
			// 	'stroke': d => d3.hsl(hueScale(d), 1, 0.5)
			// });

		circles.exit().remove();
	},
	bars: ({el, data}) => {
		el.selectAll(':not(rect)').remove();
		let hueScale = d3.scaleLinear().domain([0, d3.max(data.freq)]).range([0, 360]);
		console.log(String(d3.hsl(hueScale(10), 1, 0.5)));

		let rects = el.selectAll('rect').data(data.freq);

		rects.enter().append("rect");

		setAttr(rects, {
			x: (d, i) => i * (el.attr('width') / data.freq.length),
			y: d => el.attr('height') - d,
			width: (el.attr('width') / data.freq.length) - 1,
			height: d => d,
			fill: d => d3.hsl(hueScale(d), 1, 0.5)
		});

		rects.exit().remove();
	},
	lights: ({el, data}) => {
		function componentToHex(c) {
			var hex = parseInt(c, 10).toString(16);
			return hex.length === 1 ? "0" + hex : hex;
		}
		function rgbToHex(r, g, b) {
			return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
		}
		let hueScale = d3.scaleLinear().domain([0, d3.max(data.freq)]).range([0, 360]);
		// console.log(color, hex, data);
		// request.get(url)
		// 	.query({apikey: '61F3426110E29B53', value: hex})
		// 	.then(res => console.log(res));
		ws.forEach((c, i) => {
			let color = d3.hsl(hueScale(data.freq[10 + (i + 1) * parseInt((128 - 58) / lights.length, 10)]), 1, 0.5).rgb();
			let hex = rgbToHex(color.r, color.g, color.b);
			c.send(JSON.stringify({action: "color", data: {rgb: hex}}));
		});
	}
})({el: d3scene, data: state.data});

let unhook = () => {};
const hook = ({state$, actions}) => {
	let subs = [];

	const d3scene$ = $.interval(100)
		.map(() => document.querySelector('svg#scene'))
		.distinctUntilChanged(el => el)
		.filter(el => el)
		.map(el => d3.select('svg#scene'))
		.share();

	subs.push(
		$.combineLatest(
			d3scene$,
			state$.distinctUntilChanged(state => state.data).skip(1),
			(d3scene, state) => ({d3scene, state})
		)
			.subscribe(render)
	);

	unhook = () => {
		console.log(subs);

		subs.forEach(sub => sub.dispose ? sub.dispose() : sub());
	};
};

module.exports = {
	hook,
	unhook: () => unhook()
};
