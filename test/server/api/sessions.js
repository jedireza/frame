'use strict';
const AuthPlugin = require('../../../server/auth');
const AuthenticatedUser = require('../fixtures/credentials-admin');
const AuthenticatedAccount = require('../fixtures/credentials-account');
const Code = require('code');
const Config = require('../../../config');
const Hapi = require('hapi');
const HapiAuthBasic = require('hapi-auth-basic');
const Lab = require('lab');
const MakeMockModel = require('../fixtures/make-mock-model');
const Manifest = require('../../../manifest');
const Path = require('path');
const Proxyquire = require('proxyquire');
const SessionPlugin = require('../../../server/api/sessions');


const lab = exports.lab = Lab.script();
let request;
let server;
let stub;


lab.before((done) => {

    stub = {
        Session: MakeMockModel()
    };

    const proxy = {};
    proxy[Path.join(process.cwd(), './server/models/session')] = stub.Session;

    const ModelsPlugin = {
        register: Proxyquire('hapi-mongo-models', proxy),
        options: Manifest.get('/registrations').filter((reg) => {

            if (reg.plugin &&
                reg.plugin.register &&
                reg.plugin.register === 'hapi-mongo-models') {

                return true;
            }

            return false;
        })[0].plugin.options
    };

    const plugins = [HapiAuthBasic, ModelsPlugin, AuthPlugin, SessionPlugin];
    server = new Hapi.Server();
    server.connection({ port: Config.get('/port/web') });
    server.register(plugins, (err) => {

        if (err) {
            return done(err);
        }

        server.initialize(done);
    });
});


lab.after((done) => {

    server.plugins['hapi-mongo-models'].MongoModels.disconnect();

    done();
});


lab.experiment('Session Plugin Result List', () => {

    lab.beforeEach((done) => {

        request = {
            method: 'GET',
            url: '/sessions',
            credentials: AuthenticatedUser
        };

        done();
    });


    lab.test('it returns an error when paged find fails', (done) => {

        stub.Session.pagedFind = function () {

            const args = Array.prototype.slice.call(arguments);
            const callback = args.pop();

            callback(Error('find failed'));
        };

        server.inject(request, (response) => {

            Code.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it returns an array of documents successfully', (done) => {

        stub.Session.pagedFind = function () {

            const args = Array.prototype.slice.call(arguments);
            const callback = args.pop();

            callback(null, { data: [{}, {}, {}] });
        };

        server.inject(request, (response) => {

            Code.expect(response.statusCode).to.equal(200);
            Code.expect(response.result.data).to.be.an.array();
            Code.expect(response.result.data[0]).to.be.an.object();

            done();
        });
    });
});


lab.experiment('Session Plugin Read', () => {

    lab.beforeEach((done) => {

        request = {
            method: 'GET',
            url: '/sessions/93EP150D35',
            credentials: AuthenticatedUser
        };

        done();
    });


    lab.test('it returns an error when find by id fails', (done) => {

        stub.Session.findById = function (id, callback) {

            callback(Error('find by id failed'));
        };

        server.inject(request, (response) => {

            Code.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it returns a not found when find by id misses', (done) => {

        stub.Session.findById = function (id, callback) {

            callback();
        };

        server.inject(request, (response) => {

            Code.expect(response.statusCode).to.equal(404);
            Code.expect(response.result.message).to.match(/document not found/i);

            done();
        });
    });


    lab.test('it returns a document successfully', (done) => {

        stub.Session.findById = function (id, callback) {

            callback(null, { _id: '93EP150D35' });
        };

        server.inject(request, (response) => {

            Code.expect(response.statusCode).to.equal(200);
            Code.expect(response.result).to.be.an.object();

            done();
        });
    });
});


lab.experiment('Sessions Plugin (My) Read', () => {

    lab.beforeEach((done) => {

        request = {
            method: 'GET',
            url: '/sessions/my',
            credentials: AuthenticatedUser
        };

        done();
    });


    lab.test('it returns an error when find by id fails', (done) => {

        stub.Session.find = function (id, callback) {

            callback(Error('find by id failed'));
        };

        server.inject(request, (response) => {

            Code.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it returns a not found when find by id misses', (done) => {

        stub.Session.find = function (id, callback) {

            callback();
        };

        server.inject(request, (response) => {

            Code.expect(response.statusCode).to.equal(404);
            Code.expect(response.result.message).to.match(/document not found/i);

            done();
        });
    });


    lab.test('it returns a document successfully', (done) => {

        stub.Session.find = function (id, callback) {

            callback(null, [{ _id: '93EP150D35' }]);
        };

        server.inject(request, (response) => {

            Code.expect(response.statusCode).to.equal(200);
            Code.expect(response.result[0]).to.be.an.object();

            done();
        });
    });
});


lab.experiment('Session Plugin Delete By User', () => {

    lab.beforeEach((done) => {

        request = {
            method: 'DELETE',
            url: '/sessions/my/93EP150D35',
            credentials: AuthenticatedAccount
        };

        done();
    });


    lab.test('it returns an error when delete by id fails', (done) => {

        stub.Session.findByIdAndDelete = function (id, callback) {

            callback(Error('update by id failed'));
        };

        server.inject(request, (response) => {

            Code.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it returns a not found when update by id misses', (done) => {

        stub.Session.findByIdAndDelete = function (id, callback) {

            callback(null, undefined);
        };

        server.inject(request, (response) => {

            Code.expect(response.statusCode).to.equal(404);
            Code.expect(response.result.message).to.match(/document not found/i);

            done();
        });
    });


    lab.test('it updates a document successfully', (done) => {

        stub.Session.findByIdAndDelete = function (id, callback) {

            callback(null, 1);
        };

        server.inject(request, (response) => {

            Code.expect(response.statusCode).to.equal(200);

            done();
        });
    });

    lab.test('it returns an error if you delete the current session', (done) => {


        AuthenticatedAccount.session._id = '93EP150D35';

        server.inject(request, (response) => {

            Code.expect(response.statusCode).to.equal(400);
            Code.expect(response.result.message).to.match(/Unable to close your current session. You can use logout instead./i);
            done();
        });
    });
});


lab.experiment('Session Plugin Delete by Admin', () => {

    lab.beforeEach((done) => {

        request = {
            method: 'DELETE',
            url: '/sessions/93EP150D35',
            credentials: AuthenticatedUser
        };

        done();
    });


    lab.test('it returns an error when delete by id fails', (done) => {

        stub.Session.findByIdAndDelete = function (id, callback) {

            callback(Error('delete by id failed'));
        };

        server.inject(request, (response) => {

            Code.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it returns a not found when delete by id misses', (done) => {

        stub.Session.findByIdAndDelete = function (id, callback) {

            callback(null, undefined);
        };

        server.inject(request, (response) => {

            Code.expect(response.statusCode).to.equal(404);
            Code.expect(response.result.message).to.match(/document not found/i);

            done();
        });
    });


    lab.test('it deletes a document successfully', (done) => {

        stub.Session.findByIdAndDelete = function (id, callback) {

            callback(null, 1);
        };

        server.inject(request, (response) => {

            Code.expect(response.statusCode).to.equal(200);
            Code.expect(response.result.message).to.match(/success/i);

            done();
        });
    });
});
