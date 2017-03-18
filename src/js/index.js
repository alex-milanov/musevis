'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

const d3 = require('d3');

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

// d3 code here
const initd3 = () => {
	const dataTsv = "https://gist.githubusercontent.com/alex-milanov/eabaa766034d1094309f41994164f515/raw/26538cbd3afe46554d8f0fff24d2bd782e9bd017/data.tsv";
	console.log(123);
	const svg = d3.select("svg");
	const margin = {top: 20, right: 20, bottom: 30, left: 40};
	const width = Number(svg.attr("width")) - margin.left - margin.right;
	const height = Number(svg.attr("height")) - margin.top - margin.bottom;

	var x = d3.scaleBand().rangeRound([0, width]).padding(0.1);
	const y = d3.scaleLinear().rangeRound([height, 0]);

	const g = svg.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	d3.tsv(dataTsv, d => Object.assign({}, d, {frequency: Number(d.frequency)}),
		(error, data) => {
			if (error) throw error;

			x.domain(data.map(d => d.letter));
			y.domain([0, d3.max(data, d => d.frequency)]);

			// x axis
			g.append("g")
					.attr("class", "axis axis--x")
					.attr("transform", "translate(0," + height + ")")
					.call(d3.axisBottom(x));

			// y axis
			g.append("g")
					.attr("class", "axis axis--y")
					.call(d3.axisLeft(y).ticks(10, "%"))
				.append("text")
					.attr("transform", "rotate(-90)")
					.attr("y", 6)
					.attr("dy", "0.71em")
					.attr("text-anchor", "end")
					.text("Frequency");

			// bars
			g.selectAll(".bar")
				.data(data)
				.enter().append("rect")
					.attr("class", "bar")
					.attr("x", d => x(d.letter))
					.attr("y", d => y(d.frequency))
					.attr("width", x.bandwidth())
					.attr("height", d => height - y(d.frequency));
		});
};

state$
	.take(1)
	.delay(100)
	.subscribe(() => initd3());

// state -> ui
const ui$ = state$.map(state => ui({state, actions}));
vdom.patchStream(ui$, '.app');
