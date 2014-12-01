var Lab = require('lab');
var Code = require('code');
var lab = exports.lab = Lab.script();
var config = require('../../../config');
var Hapi = require('hapi');
var hapiAuthBasic = require('hapi-auth-basic');
var proxyquire = require('proxyquire');
var authPlugin = require('../../../server/auth');
var logoutPlugin = require('../../../server/api/logout');
var authenticatedUser = require('../fixtures/credentials-admin');
var stub, modelsPlugin, server, request;


lab.beforeEach(function (done) {

    stub = {
        Session: {}
    };

    modelsPlugin = proxyquire('../../../server/models', {
        '../models/session': stub.Session
    });

    var plugins = [ hapiAuthBasic, modelsPlugin, authPlugin, logoutPlugin ];
    server = new Hapi.Server();
    server.connection({ port: config.get('/port/web') });
    server.register(plugins, function (err) {

        if (err) {
            return done(err);
        }

        done();
    });
});


lab.afterEach(function (done) {

    server.plugins.models.BaseModel.disconnect();

    done();
});


lab.experiment('Logout Plugin (Delete Session)', function () {

    lab.beforeEach(function (done) {

        request = {
            method: 'DELETE',
            url: '/logout',
            credentials: authenticatedUser
        };

        done();
    });


    lab.test('it returns an error when remove fails', function (done) {

        stub.Session.remove = function () {

            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();

            callback(Error('remove failed'));
        };

        server.inject(request, function (response) {

            Code.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it returns a not found when remove misses', function (done) {

        stub.Session.remove = function () {

            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();

            callback(null, 0);
        };

        delete request.credentials;

        server.inject(request, function (response) {

            Code.expect(response.statusCode).to.equal(404);
            Code.expect(response.result.message).to.match(/session not found/i);

            done();
        });
    });


    lab.test('it removes the authenticated user session successfully', function (done) {

        stub.Session.remove = function () {

            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();

            callback(null, 1);
        };

        server.inject(request, function (response) {

            Code.expect(response.statusCode).to.equal(200);
            Code.expect(response.result.message).to.match(/success/i);

            done();
        });
    });
});
