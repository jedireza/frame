var Lab = require('lab');
var Code = require('code');
var lab = exports.lab = Lab.script();
var config = require('../../../config');
var Hapi = require('hapi');
var hapiAuthBasic = require('hapi-auth-basic');
var proxyquire = require('proxyquire');
var signupPlugin = require('../../../plugins/api/signup');
var mailerPlugin = require('../../../plugins/mailer');
var stub, modelsPlugin, server, request;


lab.beforeEach(function (done) {

    stub = {
        Account: {},
        Session: {},
        User: {}
    };

    modelsPlugin = proxyquire('../../../plugins/models', {
        '../models/account': stub.Account,
        '../models/session': stub.Session,
        '../models/user': stub.User,
    });

    var plugins = [ hapiAuthBasic, modelsPlugin, mailerPlugin, signupPlugin ];
    server = new Hapi.Server(config.get('/port/web'));
    server.pack.register(plugins, function (err) {

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


lab.experiment('Signup Plugin', function () {

    lab.beforeEach(function (done) {

        request = {
            method: 'POST',
            url: '/signup',
            payload: {
                name: 'Muddy Mudskipper',
                username: 'muddy',
                password: 'dirtandwater',
                email: 'mrmud@mudmail.mud'
            }
        };

        done();
    });


    lab.test('it returns an error when find one fails for username check', function (done) {

        stub.User.findOne = function (conditions, callback) {

            if (conditions.username) {
                callback(Error('find one failed'));
            }
            else {
                callback();
            }
        };

        server.inject(request, function (response) {

            Code.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it returns a conflict when find one hits for username check', function (done) {

        stub.User.findOne = function (conditions, callback) {

            if (conditions.username) {
                callback(null, {});
            }
            else {
                callback(Error('find one failed'));
            }
        };

        server.inject(request, function (response) {

            Code.expect(response.statusCode).to.equal(409);

            done();
        });
    });


    lab.test('it returns an error when find one fails for email check', function (done) {

        stub.User.findOne = function (conditions, callback) {

            if (conditions.email) {
                callback(Error('find one failed'));
            }
            else {
                callback();
            }
        };

        server.inject(request, function (response) {

            Code.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it returns a conflict when find one hits for email check', function (done) {

        stub.User.findOne = function (conditions, callback) {

            if (conditions.email) {
                callback(null, {});
            }
            else {
                callback();
            }
        };

        server.inject(request, function (response) {

            Code.expect(response.statusCode).to.equal(409);

            done();
        });
    });


    lab.test('it returns an error if any critical setup step fails', function (done) {

        stub.User.findOne = function (conditions, callback) {

            callback();
        };

        stub.User.create = function (username, password, email, callback) {

            callback(Error('create failed'));
        };

        server.inject(request, function (response) {

            Code.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it finishes successfully', function (done) {

        stub.User.findOne = function (conditions, callback) {

            callback();
        };

        stub.User.create = function (username, password, email, callback) {

            callback(null, { _id: 'BL4M0' });
        };

        stub.Account.create = function (name, callback) {

            var account = {
                _id: 'BL4M0',
                name: {
                    first: 'Muddy',
                    last: 'Mudskipper'
                }
            };

            callback(null, account);
        };

        stub.User.findByIdAndUpdate = function (id, update, callback) {

            callback(null, [{}, {}]);
        };

        stub.Account.findByIdAndUpdate = function (id, update, callback) {

            callback(null, [{}, {}]);
        };

        var realSendEmail = server.plugins.mailer.sendEmail;
        server.plugins.mailer.sendEmail = function (options, template, context, callback) {

            callback(null, {});
        };

        stub.Session.create = function (username, callback) {

            callback(null, {});
        };

        server.inject(request, function (response) {

            Code.expect(response.statusCode).to.equal(200);
            Code.expect(response.result).to.be.an.object();

            server.plugins.mailer.sendEmail = realSendEmail;

            done();
        });
    });
});