var Lab = require('lab');
var lab = exports.lab = Lab.script();
var config = require('../../../config');
var Hapi = require('hapi');
var homePlugin = require('../../../plugins/web/index');
var visionaryPlugin = {
    plugin: require('visionary'),
    options: {
        engines: { jade: 'jade' },
        path: './plugins/web'
    }
};
var server, request;


lab.beforeEach(function (done) {

    var plugins = [ visionaryPlugin, homePlugin ];
    server = new Hapi.Server(config.get('/port/web'));
    server.pack.register(plugins, function (err) {

        if (err) {
            return done(err);
        }

        done();
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

            Lab.expect(response.result).to.match(/activate the plot device/i);
            Lab.expect(response.statusCode).to.equal(200);

            done();
        });
    });
});
