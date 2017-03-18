'use strict';

// dom
const {section, button, span, h1} = require('iblokz/adapters/vdom');
// components
const counter = require('./counter');

module.exports = ({state, actions}) => section('#ui', [
	h1('xAmp Prototype')
]);
