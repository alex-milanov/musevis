'use strict';

const {obj} = require('iblokz-data');

// initial
const initial = {
	playing: false,
	vis: 'circles'
};

// actions
const toggle = path => state => obj.patch(state, path, !obj.sub(state, path));
const set = (path, value) => state => obj.patch(state, path, value);

module.exports = {
	initial,
	toggle,
	set
};
