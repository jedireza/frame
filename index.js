var Glue = require('glue');
var manifest = require('./manifest');


var composeOptions = {
    relativeTo: __dirname
};


module.exports = Glue.compose.bind(Glue, manifest.get('/'), composeOptions);
