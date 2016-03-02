var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var request = require('request');

var projectionsPath = './projections/';

module.exports = function(fileName, config, callback) {
	var createData = {
		date: new Date()
	};

	var projectionName = toCapitalizedWords(fileName.split('.')[0]);
	createProjection(fileName, config, function() {
		callback();
	});
}

function createProjection(fileName, config, callback) {
	var url = 'http://' + config.http.credentials.username + ':' + config.http.credentials.password + '@' + config.http.hostname + ':' + config.http.port + '/projections/continuous?emit=1';
	var projectionName = toCapitalizedWords(fileName.split('.')[0]);
	var filePath = path.join(__dirname, projectionsPath + fileName);
	var projectionContent = fs.readFileSync(filePath, {
		encoding: 'utf8'
	});

	request.post({
		url: url,
		qs: {
			name: projectionName,
			enabled: 'yes'
		},
		headers: {
			'Content-Type': 'application/json',
		},
		body: projectionContent
	}, function(error, response, body) {
		if (error)
			throw new Error(error);
		else {
			setTimeout(function() {
				callback();
			}, 250);
		}
	});
};

function toCapitalizedWords(name) {
	var words = name.match(/[A-Za-z][a-z]*/g);
	return words.map(capitalize).join("");
}

function capitalize(word) {
	return word.charAt(0).toUpperCase() + word.substring(1);
}