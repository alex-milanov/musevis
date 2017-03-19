'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

let d3 = window.d3;

// iblokz
const vdom = require('iblokz-snabbdom-helpers');
const {obj, arr} = require('iblokz-data');

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

const renderCircles = ({el, frequencyData}) => {
	// console.log(frequencyData);

	// scale things to fit
	let radiusScale = d3.scale.linear()
			.domain([0, d3.max(frequencyData)])
			.range([0, el.attr('height') / 2 - 10]);

	let hueScale = d3.scale.linear()
			.domain([0, d3.max(frequencyData)])
			.range([0, 360]);

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
	const audioCtx = new ((window.AudioContext || window.webkitAudioContext
		|| window.mozAudioContext || window.oAudioContext || window.msAudioContext))();
	const audioElement = document.getElementById('song');
	const audioSrc = audioCtx.createMediaElementSource(audioElement);
	const analyser = audioCtx.createAnalyser();
	const scriptNode = audioCtx.createScriptProcessor(4096, 1, 1);

	scriptNode.onaudioprocess = function(ev) {
		// The input buffer is the song we loaded earlier
		var inputBuffer = ev.inputBuffer;

		// The output buffer contains the samples that will be modified and played
		var outputBuffer = ev.outputBuffer;

		// Loop through the output channels (in this case there is only one)
		for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
			var inputData = inputBuffer.getChannelData(channel);
			var outputData = outputBuffer.getChannelData(channel);

			console.log(inputData);

			// Loop through the 4096 samples
			for (var sample = 0; sample < inputBuffer.length; sample++) {
				// make output equal to the same as the input
				outputData[sample] = inputData[sample];
			}
		}
	};

	// bind our analyser to the media element source.
	audioSrc.connect(analyser);
	audioSrc.connect(audioCtx.destination);
	// scriptNode.connect(analyser);
	// scriptNode.connect(audioCtx.destination);

	analyser.fftSize = 256;

	console.log(scriptNode);

	function animate() {
		requestAnimationFrame(animate);
		let frequencyData = new Uint8Array(analyser.frequencyBinCount);
		// copy frequency data to frequencyData array.
		analyser.getByteFrequencyData(frequencyData);
		console.log(frequencyData);
		renderCircles({el: svg, frequencyData});
	}

	animate();
};

state$
	.take(1)
	.delay(1000)
	.subscribe(() => initd3());

// state -> ui
const ui$ = state$.map(state => ui({state, actions}));
vdom.patchStream(ui$, '.app');

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
