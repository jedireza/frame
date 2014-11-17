var Joi = require('joi');
var Hoek = require('hoek');
var async = require('async');
var bcrypt = require('bcrypt');
var config = require('../../config');


exports.register = function (plugin, options, next) {

    options = Hoek.applyToDefaults({ basePath: '' }, options);


    plugin.route({
        method: 'POST',
        path: options.basePath + '/login',
        config: {
            validate: {
                payload: {
                    username: Joi.string().required(),
                    password: Joi.string().required()
                }
            },
            pre: [{
                assign: 'abuseDetected',
                method: function (request, reply) {

                    var AuthAttempt = request.server.plugins.models.AuthAttempt;
                    var ip = request.info.remoteAddress;
                    var username = request.payload.username;

                    AuthAttempt.abuseDetected(ip, username, function (err, detected) {

                        if (err) {
                            return reply(err);
                        }

                        if (detected) {
                            return reply({
                                message: 'Maximum number of auth attempts reached. Please try again later.'
                            }).takeover().code(400);
                        }

                        reply();
                    });
                }
            },{
                assign: 'user',
                method: function (request, reply) {

                    var User = request.server.plugins.models.User;
                    var username = request.payload.username;
                    var password = request.payload.password;

                    User.findByCredentials(username, password, function (err, user) {

                        if (err) {
                            return reply(err);
                        }

                        reply(user);
                    });
                }
            },{
                assign: 'logAttempt',
                method: function (request, reply) {

                    if (request.pre.user) {
                        return reply();
                    }

                    var AuthAttempt = request.server.plugins.models.AuthAttempt;
                    var ip = request.info.remoteAddress;
                    var username = request.payload.username;

                    AuthAttempt.create(ip, username, function (err, authAttempt) {

                        if (err) {
                            return reply(err);
                        }

                        return reply({
                            message: 'Username and password combination not found or account is inactive.'
                        }).takeover().code(400);
                    });
                }
            },{
                assign: 'session',
                method: function (request, reply) {

                    var Session = request.server.plugins.models.Session;

                    Session.create(request.pre.user.username, function (err, session) {

                        if (err) {
                            return reply(err);
                        }

                        return reply(session);
                    });
                }
            }]
        },
        handler: function (request, reply) {

            var credentials = request.pre.user.username + ':' + request.pre.session.key;
            var authHeader = 'Basic ' + new Buffer(credentials).toString('base64');

            reply({
                user: {
                    _id: request.pre.user._id,
                    username: request.pre.user.username,
                    email: request.pre.user.email,
                    roles: request.pre.user.roles
                },
                session: request.pre.session,
                authHeader: authHeader
            });
        }
    });


    plugin.route({
        method: 'POST',
        path: options.basePath + '/login/forgot',
        config: {
            validate: {
                payload: {
                    email: Joi.string().email().required()
                }
            },
            pre: [{
                assign: 'user',
                method: function (request, reply) {

                    var User = request.server.plugins.models.User;
                    var conditions = {
                        email: request.payload.email.toLowerCase()
                    };

                    User.findOne(conditions, function (err, user) {

                        if (err) {
                            return reply(err);
                        }

                        if (!user) {
                            return reply({ message: 'Success.' }).takeover();
                        }

                        reply(user);
                    });
                }
            }]
        },
        handler: function (request, reply) {

            var Session = request.server.plugins.models.Session;
            var User = request.server.plugins.models.User;
            var mailer = request.server.plugins.mailer;

            async.auto({
                keyHash: function (done) {

                    Session.generateKeyHash(done);
                },
                user: ['keyHash', function (done, results) {

                    var id = request.pre.user._id.toString();
                    var update = {
                        $set: {
                            resetPassword: {
                                token: results.keyHash.hash,
                                expires: Date.now() + 10000000
                            }
                        }
                    };

                    User.findByIdAndUpdate(id, update, done);
                }],
                email: ['user', function (done, results) {

                    var options = {
                        subject: 'Reset your ' + config.get('/projectName')    + ' password',
                        to: request.payload.email
                    };
                    var template = 'forgot-password';
                    var context = {
                        key: results.keyHash.key
                    };

                    mailer.sendEmail(options, template, context, done);
                }]
            }, function (err, results) {

                if (err) {
                    return reply(err);
                }

                reply({ message: 'Success.' });
            });
        }
    });


    plugin.route({
        method: 'POST',
        path: options.basePath + '/login/reset',
        config: {
            validate: {
                payload: {
                    key: Joi.string().required(),
                    email: Joi.string().email().required(),
                    password: Joi.string().required()
                }
            },
            pre: [{
                assign: 'user',
                method: function (request, reply) {

                    var User = request.server.plugins.models.User;
                    var conditions = {
                        email: request.payload.email.toLowerCase(),
                        'resetPassword.expires': { $gt: Date.now() }
                    };

                    User.findOne(conditions, function (err, user) {

                        if (err) {
                            return reply(err);
                        }

                        if (!user) {
                            return reply({ message: 'Invalid email or key.' }).takeover().code(400);
                        }

                        reply(user);
                    });
                }
            }]
        },
        handler: function (request, reply) {

            var User = request.server.plugins.models.User;

            async.auto({
                keyMatch: function (done) {

                    var key = request.payload.key;
                    var token = request.pre.user.resetPassword.token;
                    bcrypt.compare(key, token, done);
                },
                passwordHash: ['keyMatch', function (done, results) {

                    if (!results.keyMatch) {
                        return reply({ message: 'Invalid email or key.' }).takeover().code(400);
                    }

                    User.generatePasswordHash(request.payload.password, done);
                }],
                user: ['passwordHash', function (done, results) {

                    var id = request.pre.user._id.toString();
                    var update = {
                        $set: {
                            password: results.passwordHash.hash
                        },
                        $unset: {
                            resetPassword: undefined
                        }
                    };

                    User.findByIdAndUpdate(id, update, done);
                }]
            }, function (err, results) {

                if (err) {
                    return reply(err);
                }

                reply({ message: 'Success.' });
            });
        }
    });


    next();
};


exports.register.attributes = {
    name: 'login'
};
