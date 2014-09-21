var Hapi = require('hapi');
var manifest = require('./manifest');
var composeOptions = {
    relativeTo: __dirname
};

module.exports = Hapi.Pack.compose.bind(Hapi.Pack, manifest.get('/'), composeOptions);
