var Boom = require('boom');
var Joi = require('joi');
var Async = require('async');
var Config = require('../../config');


var internals = {};


internals.applyRoutes = function (server, next) {

    var Account = server.plugins['hapi-mongo-models'].Account;
    var Session = server.plugins['hapi-mongo-models'].Session;
    var User = server.plugins['hapi-mongo-models'].User;


    server.route({
        method: 'POST',
        path: '/signup',
        config: {
            validate: {
                payload: {
                    name: Joi.string().required(),
                    email: Joi.string().email().lowercase().required(),
                    username: Joi.string().token().lowercase().required(),
                    password: Joi.string().required()
                }
            },
            pre: [{
                assign: 'usernameCheck',
                method: function (request, reply) {

                    var conditions = {
                        username: request.payload.username
                    };

                    User.findOne(conditions, function (err, user) {

                        if (err) {
                            return reply(err);
                        }

                        if (user) {
                            return reply(Boom.conflict('Username already in use.'));
                        }

                        reply(true);
                    });
                }
            }, {
                assign: 'emailCheck',
                method: function (request, reply) {

                    var conditions = {
                        email: request.payload.email
                    };

                    User.findOne(conditions, function (err, user) {

                        if (err) {
                            return reply(err);
                        }

                        if (user) {
                            return reply(Boom.conflict('Email already in use.'));
                        }

                        reply(true);
                    });
                }
            }]
        },
        handler: function (request, reply) {

            var mailer = request.server.plugins.mailer;

            Async.auto({
                user: function (done) {

                    var username = request.payload.username;
                    var password = request.payload.password;
                    var email = request.payload.email;

                    User.create(username, password, email, done);
                },
                account: ['user', function (done, results) {

                    var name = request.payload.name;

                    Account.create(name, done);
                }],
                linkUser: ['account', function (done, results) {

                    var id = results.account._id.toString();
                    var update = {
                        $set: {
                            user: {
                                id: results.user._id.toString(),
                                name: results.user.username
                            }
                        }
                    };

                    Account.findByIdAndUpdate(id, update, done);
                }],
                linkAccount: ['account', function (done, results) {

                    var id = results.user._id.toString();
                    var update = {
                        $set: {
                            roles: {
                                account: {
                                    id: results.account._id.toString(),
                                    name: results.account.name.first + ' ' + results.account.name.last
                                }
                            }
                        }
                    };

                    User.findByIdAndUpdate(id, update, done);
                }],
                welcome: ['linkUser', 'linkAccount', function (done, results) {

                    var emailOptions = {
                        subject: 'Your ' + Config.get('/projectName') + ' account',
                        to: {
                            name: request.payload.name,
                            address: request.payload.email
                        }
                    };
                    var template = 'welcome';

                    mailer.sendEmail(emailOptions, template, request.payload, function (err) {

                        if (err) {
                            console.warn('sending welcome email failed:', err.stack);
                        }
                    });

                    done();
                }],
                session: ['linkUser', 'linkAccount', function (done, results) {

                    Session.create(results.user._id.toString(), done);
                }]
            }, function (err, results) {

                if (err) {
                    return reply(err);
                }

                var user = results.linkAccount;
                var credentials = user.username + ':' + results.session.key;
                var authHeader = 'Basic ' + new Buffer(credentials).toString('base64');

                reply({
                    user: {
                        _id: user._id,
                        username: user.username,
                        email: user.email,
                        roles: user.roles
                    },
                    session: results.session,
                    authHeader: authHeader
                });
            });
        }
    });


    next();
};


exports.register = function (server, options, next) {

    server.dependency(['mailer', 'hapi-mongo-models'], internals.applyRoutes);

    next();
};


exports.register.attributes = {
    name: 'signup'
};
