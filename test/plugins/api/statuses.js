var Lab = require('lab');
var Code = require('code');
var lab = exports.lab = Lab.script();
var config = require('../../../config');
var Hapi = require('hapi');
var hapiAuthBasic = require('hapi-auth-basic');
var proxyquire = require('proxyquire');
var authPlugin = require('../../../plugins/auth');
var statusesPlugin = require('../../../plugins/api/statuses');
var authenticatedUser = require('../../fixtures/credentials-admin');
var stub, modelsPlugin, server, request;


lab.beforeEach(function (done) {

    stub = {
        Status: {}
    };

    modelsPlugin = proxyquire('../../../plugins/models', {
        '../models/status': stub.Status
    });

    var plugins = [ hapiAuthBasic, modelsPlugin, authPlugin, statusesPlugin ];
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


lab.experiment('Statuses Plugin Result List', function () {

    lab.beforeEach(function (done) {

        request = {
            method: 'GET',
            url: '/statuses',
            credentials: authenticatedUser
        };

        done();
    });


    lab.test('it returns an error when paged find fails', function (done) {

        stub.Status.pagedFind = function () {

            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();

            callback(Error('paged find failed'));
        };

        server.inject(request, function (response) {

            Code.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it returns an array of documents successfully', function (done) {

        stub.Status.pagedFind = function () {

            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();

            callback(null, { data: [{}, {}, {}] });
        };

        server.inject(request, function (response) {

            Code.expect(response.statusCode).to.equal(200);
            Code.expect(response.result.data).to.be.an.array();
            Code.expect(response.result.data[0]).to.be.an.object();

            done();
        });
    });
});


lab.experiment('Statuses Plugin Read', function () {

    lab.beforeEach(function (done) {

        request = {
            method: 'GET',
            url: '/statuses/93EP150D35',
            credentials: authenticatedUser
        };

        done();
    });


    lab.test('it returns an error when find by id fails', function (done) {

        stub.Status.findById = function (id, callback) {

            callback(Error('find by id failed'));
        };

        server.inject(request, function (response) {

            Code.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it returns a not found when find by id misses', function (done) {

        stub.Status.findById = function (id, callback) {

            callback();
        };

        server.inject(request, function (response) {

            Code.expect(response.statusCode).to.equal(404);
            Code.expect(response.result.message).to.match(/document not found/i);

            done();
        });
    });


    lab.test('it returns a document successfully', function (done) {

        stub.Status.findById = function (id, callback) {

            callback(null, { _id: '93EP150D35' });
        };

        server.inject(request, function (response) {

            Code.expect(response.statusCode).to.equal(200);
            Code.expect(response.result).to.be.an.object();

            done();
        });
    });
});


lab.experiment('Statuses Plugin Create', function () {

    lab.beforeEach(function (done) {

        request = {
            method: 'POST',
            url: '/statuses',
            payload: {
                pivot: 'Account',
                name: 'Happy'
            },
            credentials: authenticatedUser
        };

        done();
    });


    lab.test('it returns an error when create fails', function (done) {

        stub.Status.create = function (pivot, name, callback) {

            callback(Error('create failed'));
        };

        server.inject(request, function (response) {

            Code.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it creates a document successfully', function (done) {

        stub.Status.create = function (pivot, name, callback) {

            callback(null, {});
        };

        server.inject(request, function (response) {

            Code.expect(response.statusCode).to.equal(200);
            Code.expect(response.result).to.be.an.object();

            done();
        });
    });
});


lab.experiment('Statuses Plugin Update', function () {

    lab.beforeEach(function (done) {

        request = {
            method: 'PUT',
            url: '/statuses/account-happy',
            payload: {
                name: 'Happy'
            },
            credentials: authenticatedUser
        };

        done();
    });


    lab.test('it returns an error when update fails', function (done) {

        stub.Status.findByIdAndUpdate = function (id, update, callback) {

            callback(Error('update failed'));
        };

        server.inject(request, function (response) {

            Code.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it updates a document successfully', function (done) {

        stub.Status.findByIdAndUpdate = function (id, update, callback) {

            callback(null, {});
        };

        server.inject(request, function (response) {

            Code.expect(response.statusCode).to.equal(200);
            Code.expect(response.result).to.be.an.object();

            done();
        });
    });
});


lab.experiment('Statuses Plugin Delete', function () {

    lab.beforeEach(function (done) {

        request = {
            method: 'DELETE',
            url: '/statuses/93EP150D35',
            credentials: authenticatedUser
        };

        done();
    });


    lab.test('it returns an error when remove by id fails', function (done) {

        stub.Status.findByIdAndRemove = function (id, callback) {

            callback(Error('remove by id failed'));
        };

        server.inject(request, function (response) {

            Code.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it returns a not found when remove by id misses', function (done) {

        stub.Status.findByIdAndRemove = function (id, callback) {

            callback(null, 0);
        };

        server.inject(request, function (response) {

            Code.expect(response.statusCode).to.equal(404);
            Code.expect(response.result.message).to.match(/document not found/i);

            done();
        });
    });


    lab.test('it removes a document successfully', function (done) {

        stub.Status.findByIdAndRemove = function (id, callback) {

            callback(null, 1);
        };

        server.inject(request, function (response) {

            Code.expect(response.statusCode).to.equal(200);
            Code.expect(response.result.message).to.match(/success/i);

            done();
        });
    });
});