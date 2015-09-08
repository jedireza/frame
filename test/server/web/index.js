var Lab = require('lab');
var Code = require('code');
var Config = require('../../../config');
var Manifest = require('../../../manifest');
var Hapi = require('hapi');
var Vision = require('vision');
var Visionary = require('visionary');
var HomePlugin = require('../../../server/web/index');


var VisionaryPlugin = {
    register: Visionary,
    options: Manifest.get('/plugins/visionary')
};
var lab = exports.lab = Lab.script();
var request, server;


lab.beforeEach(function (done) {

    var plugins = [Vision, VisionaryPlugin, HomePlugin];
    server = new Hapi.Server();
    server.connection({ port: Config.get('/port/web') });
    server.register(plugins, function (err) {

        if (err) {
            return done(err);
        }

        server.initialize(done);
    });
});


lab.experiment('Home Page View', function () {

    lab.beforeEach(function (done) {

        request = {
            method: 'GET',
            url: '/'
        };

        done();
    });



    lab.test('home page renders properly', function (done) {

        server.inject(request, function (response) {

            Code.expect(response.result).to.match(/activate the plot device/i);
            Code.expect(response.statusCode).to.equal(200);

            done();
        });
    });
});
