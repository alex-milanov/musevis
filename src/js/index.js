'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

let d3 = window.d3;

// iblokz
const vdom = require('iblokz/adapters/vdom');
const obj = require('iblokz/common/obj');
const arr = require('iblokz/common/arr');

// app
const app = require('./util/app');
let actions = app.adapt(require('./actions'));
let ui = require('./ui');
let actions$;

// hot reloading
if (module.hot) {
	// actions
	actions$ = $.fromEventPattern(
		h => module.hot.accept("./actions", h)
	).flatMap(() => {
		actions = app.adapt(require('./actions'));
		return actions.stream.startWith(state => state);
	}).merge(actions.stream);
	// ui
	module.hot.accept("./ui", function() {
		ui = require('./ui');
		actions.stream.onNext(state => state);
	});
} else {
	actions$ = actions.stream;
}

// actions -> state
const state$ = actions$
	.startWith(() => actions.initial)
	.scan((state, change) => change(state), {})
	.map(state => (console.log(state), state))
	.share();

const renderChart = (el, analyser) => {
	requestAnimationFrame(() => renderChart(el, analyser));
	let frequencyData = new Uint8Array(200);
	// copy frequency data to frequencyData array.
	analyser.getByteFrequencyData(frequencyData);
	// console.log(frequencyData);

	// scale things to fit
	let radiusScale = d3.scale.linear()
			.domain([0, d3.max(frequencyData)])
			.range([0, el.attr('height') / 2 - 10]);

	let hueScale = d3.scale.linear()
			.domain([0, d3.max(frequencyData)])
			.range([0, 360]);

	console.log(frequencyData);

	// update d3 chart with new data
	let circles = el.selectAll('circle')
		.data(frequencyData);

	circles.enter()
		.append('circle');

	circles
		.attr({
			'r': d => radiusScale(d),
			'cx': el.attr('width') / 2,
			'cy': el.attr('height') / 2,
			'fill': 'none',
			'stroke-width': 4,
			'stroke-opacity': 0.4,
			'stroke': d => d3.hsl(hueScale(d), 1, 0.5)
		});

	circles.exit().remove();
};

// d3 code here
const initd3 = () => {
	const svg = d3.select("svg");
	/*
	const margin = {top: 20, right: 20, bottom: 30, left: 40};
	const width = Number(svg.attr("width")) - margin.left - margin.right;
	const height = Number(svg.attr("height")) - margin.top - margin.bottom;

	var x = d3.scaleBand().rangeRound([0, width]).padding(0.1);
	const y = d3.scaleLinear().rangeRound([height, 0]);

	const g = svg.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	*/
	var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	var audioElement = document.getElementById('song');
	var audioSrc = audioCtx.createMediaElementSource(audioElement);
	var analyser = audioCtx.createAnalyser();

	// bind our analyser to the media element source.
	audioSrc.connect(analyser);
	audioSrc.connect(audioCtx.destination);

	// var frequencyData = new Uint8Array(analyser.frequencyBinCount);

	renderChart(svg, analyser);
};

state$
	.take(1)
	.delay(100)
	.subscribe(() => initd3());

// state -> ui
const ui$ = state$.map(state => ui({state, actions}));
vdom.patchStream(ui$, '.app');
