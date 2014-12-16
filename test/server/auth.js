var Lab = require('lab');
var Code = require('code');
var Path = require('path');
var Config = require('../../config');
var Manifest = require('../../manifest');
var Hapi = require('hapi');
var Session = require('../../server/models/session');
var User = require('../../server/models/user');
var Admin = require('../../server/models/admin');
var HapiAuthBasic = require('hapi-auth-basic');
var Proxyquire = require('proxyquire');
var AuthPlugin = require('../../server/auth');


var lab = exports.lab = Lab.script();
var ModelsPlugin, server, stub;


lab.beforeEach(function (done) {

    stub = {
        Session: {},
        User: {}
    };

    var proxy = {};
    proxy[Path.join(process.cwd(), './server/models/session')] = stub.Session;
    proxy[Path.join(process.cwd(), './server/models/user')] = stub.User;

    ModelsPlugin = {
        register: Proxyquire('hapi-mongo-models', proxy),
        options: Manifest.get('/plugins')['hapi-mongo-models']
    };

    var plugins = [ HapiAuthBasic, ModelsPlugin, AuthPlugin ];
    server = new Hapi.Server();
    server.connection({ port: Config.get('/port/web') });
    server.register(plugins, function (err) {

        if (err) {
            return done(err);
        }

        done();
    });
});


lab.afterEach(function (done) {

    server.plugins['hapi-mongo-models'].BaseModel.disconnect();

    done();
});


lab.experiment('Auth Plugin', function () {

    lab.test('it returns authentication credentials', function (done) {

        stub.Session.findByCredentials = function (username, key, callback) {

            callback(null, new Session({ username: 'ren', key: 'baddog' }));
        };

        stub.User.findByUsername = function (username, callback) {

            callback(null, new User({ username: 'ren' }));
        };

        server.route({
            method: 'GET',
            path: '/',
            handler: function (request, reply) {

                server.auth.test('simple', request, function (err, credentials) {

                    Code.expect(err).to.not.exist();
                    Code.expect(credentials).to.be.an.object();
                    reply('ok');
                });
            }
        });

        var request = {
            method: 'GET',
            url: '/',
            headers: {
                authorization: 'Basic ' + (new Buffer('ren:baddog')).toString('base64')
            }
        };

        server.inject(request, function (response) {

            done();
        });
    });


    lab.test('it returns an error when the session is not found', function (done) {

        stub.Session.findByCredentials = function (username, key, callback) {

            callback();
        };

        server.route({
            method: 'GET',
            path: '/',
            handler: function (request, reply) {

                server.auth.test('simple', request, function (err, credentials) {

                    Code.expect(err).to.be.an.object();
                    Code.expect(credentials).to.not.exist();
                    reply('ok');
                });
            }
        });

        var request = {
            method: 'GET',
            url: '/',
            headers: {
                authorization: 'Basic ' + (new Buffer('ren:baddog')).toString('base64')
            }
        };

        server.inject(request, function (response) {

            done();
        });
    });


    lab.test('it returns an error when the user is not found', function (done) {

        stub.Session.findByCredentials = function (username, key, callback) {

            callback(null, new Session({ username: 'ren', key: 'baddog' }));
        };

        stub.User.findByUsername = function (username, callback) {

            callback();
        };

        server.route({
            method: 'GET',
            path: '/',
            handler: function (request, reply) {

                server.auth.test('simple', request, function (err, credentials) {

                    Code.expect(err).to.be.an.object();
                    reply('ok');
                });
            }
        });

        var request = {
            method: 'GET',
            url: '/',
            headers: {
                authorization: 'Basic ' + (new Buffer('ren:baddog')).toString('base64')
            }
        };

        server.inject(request, function (response) {

            done();
        });
    });


    lab.test('it returns an error when a model error occurs', function (done) {

        stub.Session.findByCredentials = function (username, key, callback) {

            callback(Error('session fail'));
        };

        server.route({
            method: 'GET',
            path: '/',
            handler: function (request, reply) {

                server.auth.test('simple', request, function (err, credentials) {

                    Code.expect(err).to.be.an.object();
                    Code.expect(credentials).to.not.exist();
                    reply('ok');
                });
            }
        });

        var request = {
            method: 'GET',
            url: '/',
            headers: {
                authorization: 'Basic ' + (new Buffer('ren:baddog')).toString('base64')
            }
        };

        server.inject(request, function (response) {

            done();
        });
    });


    lab.test('it takes over when the required role is missing', function (done) {

        stub.Session.findByCredentials = function (username, key, callback) {

            callback(null, new Session({ username: 'ren', key: 'baddog' }));
        };

        stub.User.findByUsername = function (username, callback) {

            callback(null, new User({ username: 'ren' }));
        };

        server.route({
            method: 'GET',
            path: '/',
            config: {
                auth: {
                    strategy: 'simple',
                    scope: 'admin'
                }
            },
            handler: function (request, reply) {

                Code.expect(request.auth.credentials).to.be.an.object();

                reply('ok');
            }
        });

        var request = {
            method: 'GET',
            url: '/',
            headers: {
                authorization: 'Basic ' + (new Buffer('ren:baddog')).toString('base64')
            }
        };

        server.inject(request, function (response) {

            Code.expect(response.result.message).to.match(/insufficient scope/i);

            done();
        });
    });


    lab.test('it continues through pre handler when role is present', function (done) {

        stub.Session.findByCredentials = function (username, key, callback) {

            callback(null, new Session({ username: 'ren', key: 'baddog' }));
        };

        stub.User.findByUsername = function (username, callback) {

            var user = new User({
                username: 'ren',
                roles: {
                    admin: {
                        id: '953P150D35',
                        name: 'Ren Höek'
                    }
                }
            });

            user._roles = {
                admin: {
                    _id: '953P150D35',
                    name: {
                        first: 'Ren',
                        last: 'Höek'
                    }
                }
            };

            callback(null, user);
        };

        server.route({
            method: 'GET',
            path: '/',
            config: {
                auth: {
                    strategy: 'simple',
                    scope: ['account', 'admin']
                }
            },
            handler: function (request, reply) {

                Code.expect(request.auth.credentials).to.be.an.object();

                reply('ok');
            }
        });

        var request = {
            method: 'GET',
            url: '/',
            headers: {
                authorization: 'Basic ' + (new Buffer('ren:baddog')).toString('base64')
            }
        };

        server.inject(request, function (response) {

            Code.expect(response.result).to.match(/ok/i);

            done();
        });
    });


    lab.test('it takes over when the required group is missing', function (done) {

        stub.Session.findByCredentials = function (username, key, callback) {

            callback(null, new Session({ username: 'ren', key: 'baddog' }));
        };

        stub.User.findByUsername = function (username, callback) {

            var user = new User({
                username: 'ren',
                roles: {
                    admin: {
                        id: '953P150D35',
                        name: 'Ren Höek'
                    }
                }
            });

            user._roles = {
                admin: new Admin({
                    _id: '953P150D35',
                    name: {
                        first: 'Ren',
                        last: 'Höek'
                    }
                })
            };

            callback(null, user);
        };

        server.route({
            method: 'GET',
            path: '/',
            config: {
                auth: {
                    strategy: 'simple',
                    scope: 'admin'
                },
                pre: [
                    AuthPlugin.preware.ensureAdminGroup('root')
                ]
            },
            handler: function (request, reply) {

                Code.expect(request.auth.credentials).to.be.an.object();

                reply('ok');
            }
        });

        var request = {
            method: 'GET',
            url: '/',
            headers: {
                authorization: 'Basic ' + (new Buffer('ren:baddog')).toString('base64')
            }
        };

        server.inject(request, function (response) {

            Code.expect(response.result.message).to.match(/permission denied/i);

            done();
        });
    });


    lab.test('it continues through pre handler when group is present', function (done) {

        stub.Session.findByCredentials = function (username, key, callback) {

            callback(null, new Session({ username: 'ren', key: 'baddog' }));
        };

        stub.User.findByUsername = function (username, callback) {

            var user = new User({
                username: 'ren',
                roles: {
                    admin: {
                        id: '953P150D35',
                        name: 'Ren Höek'
                    }
                }
            });

            user._roles = {
                admin: new Admin({
                    _id: '953P150D35',
                    name: {
                        first: 'Ren',
                        last: 'Höek'
                    },
                    groups: {
                        root: 'Root'
                    }
                })
            };

            callback(null, user);
        };

        server.route({
            method: 'GET',
            path: '/',
            config: {
                auth: {
                    strategy: 'simple',
                    scope: 'admin'
                },
                pre: [
                    AuthPlugin.preware.ensureAdminGroup(['sales', 'root'])
                ]
            },
            handler: function (request, reply) {

                Code.expect(request.auth.credentials).to.be.an.object();

                reply('ok');
            }
        });

        var request = {
            method: 'GET',
            url: '/',
            headers: {
                authorization: 'Basic ' + (new Buffer('ren:baddog')).toString('base64')
            }
        };

        server.inject(request, function (response) {

            Code.expect(response.result).to.match(/ok/i);

            done();
        });
    });
});
