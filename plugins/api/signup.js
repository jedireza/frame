var Joi = require('joi');
var Hoek = require('hoek');
var async = require('async');
var config = require('../../config');


exports.register = function (plugin, options, next) {

    options = Hoek.applyToDefaults({ basePath: '' }, options);


    plugin.route({
        method: 'POST',
        path: options.basePath + '/signup',
        config: {
            validate: {
                payload: {
                    name: Joi.string().required(),
                    email: Joi.string().email().required(),
                    username: Joi.string().token().required(),
                    password: Joi.string().required()
                }
            },
            pre: [{
                assign: 'usernameCheck',
                method: function (request, reply) {

                    var User = request.server.plugins.models.User;
                    var conditions = {
                        username: request.payload.username
                    };

                    User.findOne(conditions, function (err, user) {

                        if (err) {
                            return reply(err);
                        }

                        if (user) {
                            var response = {
                                message: 'Username already in use.'
                            };

                            return reply(response).takeover().code(409);
                        }

                        reply(true);
                    });
                }
            }, {
                assign: 'emailCheck',
                method: function (request, reply) {

                    var User = request.server.plugins.models.User;
                    var conditions = {
                        email: request.payload.email.toLowerCase()
                    };

                    User.findOne(conditions, function (err, user) {

                        if (err) {
                            return reply(err);
                        }

                        if (user) {
                            var response = {
                                message: 'Email already in use.'
                            };

                            return reply(response).takeover().code(409);
                        }

                        reply(true);
                    });
                }
            }]
        },
        handler: function (request, reply) {

            var Account = request.server.plugins.models.Account;
            var User = request.server.plugins.models.User;
            var Session = request.server.plugins.models.Session;
            var mailer = request.server.plugins.mailer;

            async.auto({
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

                    var options = {
                        subject: 'Your ' + config.get('/projectName')    + ' account',
                        to: {
                            name: request.payload.name,
                            address: request.payload.email
                        }
                    };
                    var template = 'welcome';

                    mailer.sendEmail(options, template, request.payload, done);
                }],
                session: ['welcome', function (done, results) {

                    Session.create(request.payload.username, done);
                }]
            }, function (err, results) {

                if (err) {
                    return reply(err);
                }

                var user = results.linkAccount[0];
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


exports.register.attributes = {
    name: 'signup'
};
