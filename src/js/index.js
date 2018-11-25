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
const state$ = new Rx.BehaviorSubject();
// services
let audio = require('./services/audio.js');
let render = require('./services/render.js');

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
		actions.ping();
	});
	module.hot.accept("./services/audio.js", function() {
		audio.unhook();
		setTimeout(() => {
			audio = require('./services/audio.js');
			audio.hook({state$, actions});
			actions.ping();
		});
	});
	module.hot.accept("./services/render.js", function() {
		render.unhook();
		setTimeout(() => {
			render = require('./services/render.js');
			render.hook({state$, actions});
			actions.ping();
		});
	});
} else {
	actions$ = actions.stream;
}

// actions -> state
actions$
	.map(action => (
		// action.path && console.log(action.path.join('.'), action.payload),
		// console.log(action),
		action
	))
	.startWith(() => actions.initial)
	.scan((state, change) => change(state), {})
	// .map(state => (console.log(state), state))
	.subscribe(state => state$.onNext(state));

// hooks
audio.hook({state$, actions});
render.hook({state$, actions});

// state -> ui
const ui$ = state$.map(state => ui({state, actions}));
vdom.patchStream(ui$, '.app');
