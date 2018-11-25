'use strict';

const {obj} = require('iblokz-data');

// initial
const initial = {
	playing: false,
	vis: 'circles',
	data: {
		freq: new Uint8Array()
	}
};

// actions
const toggle = path => state => obj.patch(state, path, !obj.sub(state, path));
const set = (path, value) => state => obj.patch(state, path, value);
const ping = () => state => state;

module.exports = {
	initial,
	toggle,
	set,
	ping
};
