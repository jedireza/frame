var Lab = require('lab');
var Code = require('code');
var lab = exports.lab = Lab.script();
var config = require('../../../config');
var Hapi = require('hapi');
var homePlugin = require('../../../plugins/web/index');
var server, request;


lab.beforeEach(function (done) {

    var plugins = [ homePlugin ];
    server = new Hapi.Server();
    server.connection({ port: config.get('/port/web') });
    server.views({
        engines: { jade: require('jade') },
        path: './plugins/web'
    });
    server.register(plugins, function (err) {

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

            Code.expect(response.result).to.match(/activate the plot device/i);
            Code.expect(response.statusCode).to.equal(200);

            done();
        });
    });
});
