'use strict';

const {obj} = require('iblokz-data');

// initial
const initial = {
	playing: false
};

// actions
const toggle = path => state => obj.patch(state, path, !obj.sub(state, path));

module.exports = {
	initial,
	toggle
};
