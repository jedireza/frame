var Lab = require('lab');
var lab = exports.lab = Lab.script();
var config = require('../../../config');
var Hapi = require('hapi');
var indexPlugin = require('../../../plugins/api/index');
var server, request;


lab.beforeEach(function (done) {

    var plugins = [ indexPlugin ];
    server = new Hapi.Server(config.get('/port/web'));
    server.pack.register(plugins, function (err) {

        if (err) {
            return done(err);
        }

        done();
    });
});


lab.experiment('Index Plugin', function () {

    lab.beforeEach(function (done) {

        request = {
            method: 'GET',
            url: '/'
        };

        done();
    });



    lab.test('it returns the default message', function (done) {

        server.inject(request, function (response) {

            Lab.expect(response.result.message).to.match(/welcome to the plot device/i);
            Lab.expect(response.statusCode).to.equal(200);

            done();
        });
    });
});
