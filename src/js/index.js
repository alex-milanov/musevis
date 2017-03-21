'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

let d3 = window.d3;

// iblokz
const vdom = require('iblokz-snabbdom-helpers');
const {obj, arr} = require('iblokz-data');

const time = require('./util/time');

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

const render = {
	circles: ({el, data}) => {
		// scale things to fit
		let radiusScale = d3.scale.linear().domain([0, d3.max(data.freq)]).range([0, el.attr('height') / 2 - 10]);

		let hueScale = d3.scale.linear().domain([0, d3.max(data.freq)]).range([0, 360]);

		// update d3 chart with new data
		let circles = el.selectAll('circle').data(data.freq);

		circles.enter().append('circle');

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
	},
	bars: ({el, data}) => {
		let hueScale = d3.scale.linear().domain([0, d3.max(data.freq)]).range([0, 360]);

		let rects = el.selectAll('rect').data(data.freq);

		rects.enter().append("rect");

		rects.attr({
			x: (d, i) => i * (el.attr('width') / data.freq.length),
			y: d => el.attr('height') - d,
			width: (el.attr('width') / data.freq.length) - 1,
			height: d => d,
			fill: d => d3.hsl(hueScale(d), 1, 0.5)
		});

		rects.exit().remove();
	}
};

// d3 code here
const initd3 = () => {
	const el = d3.select("svg");

	// prep audio
	const audioCtx = new ((window.AudioContext || window.webkitAudioContext
		|| window.mozAudioContext || window.oAudioContext || window.msAudioContext))();
	const audioElement = document.getElementById('song');
	const audioSrc = audioCtx.createMediaElementSource(audioElement);
	const analyser = audioCtx.createAnalyser();

	// bind our analyser to the media element source.
	audioSrc.connect(analyser);
	audioSrc.connect(audioCtx.destination);
	// scriptNode.connect(analyser);
	// scriptNode.connect(audioCtx.destination);

	analyser.fftSize = 256;

	const getAudioData = analyser => {
		let data = {
			freq: new Uint8Array(analyser.frequencyBinCount)
		};
		analyser.getByteFrequencyData(data.freq);
		return data;
	};

	time
		.frame()
		.map(() => getAudioData(analyser))
		.map(data => (console.log({data}), data))
		.withLatestFrom(state$, (data, state) => ({data, state}))
		.subscribe(({data, state}) => render[state.vis]({data, el}));
};

// init d3
state$.take(1).delay(1000)
	.subscribe(() => initd3());

// state -> ui
const ui$ = state$.map(state => ui({state, actions}));
vdom.patchStream(ui$, '.app');

// play / pause
state$
	.distinctUntilChanged(state => state.playing)
	.subscribe(state => {
		const songEl = document.getElementById('song');
		console.log(songEl);
		if (state.playing)
			songEl.play();
		else
			songEl.pause();
	});
