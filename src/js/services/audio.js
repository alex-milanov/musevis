'use strict';
// lib
// rx
const Rx = require('rx');
const $ = Rx.Observable;

// util
const time = require('../util/time');

const context = new ((window.AudioContext || window.webkitAudioContext
	|| window.mozAudioContext || window.oAudioContext || window.msAudioContext))();

const init = el => {
	const audioElement = document.getElementById('song');
	const audioSrc = context.createMediaElementSource(audioElement);
	const analyser = context.createAnalyser();

	// bind our analyser to the media element source.
	audioSrc.connect(analyser);
	audioSrc.connect(context.destination);
	// scriptNode.connect(analyser);
	// scriptNode.connect(audioCtx.destination);
	analyser.fftSize = 256;
	return analyser;
};

const getAudioData = ({analyser}) => {
	let data = {
		freq: new Uint8Array(analyser.frequencyBinCount)
	};
	analyser.getByteFrequencyData(data.freq);
	return data;
};

let unhook = () => {};
const hook = ({state$, actions}) => {
	let subs = [];

	const audioEl$ = $.interval(100)
		.map(() => document.querySelector('audio#song'))
		.distinctUntilChanged(el => el)
		.filter(el => el);

	const analyser$ = audioEl$
		.map(init);

	subs.push(
		state$.distinctUntilChanged(state => state.playing)
			.subscribe(state => {
				const audioEl = document.querySelector('audio#song');
				if (audioEl) {
					if (state.playing)
						audioEl.play();
					else
						audioEl.pause();
				}
			})
	);

	subs.push(
		$.interval(100 /* ms */)
			.timeInterval()
			.withLatestFrom(
			analyser$,
			state$.distinctUntilChanged(state => state.vis + state.playing),
			// time.frame().map(dt => parseInt(dt, 10))
			// 	.filter(dt => dt % 64 === 0),
				// .map(dt => (console.log(dt), dt)),
			(dt, analyser, state) => ({analyser, state})
		)
			.filter(({state}) => state.playing)
			.map(getAudioData)
			.subscribe(data => actions.set('data', data))
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
