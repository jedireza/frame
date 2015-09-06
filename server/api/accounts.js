var Boom = require('boom');
var Async = require('async');
var Joi = require('joi');
var Hoek = require('hoek');
var AuthPlugin = require('../auth');


var internals = {};


internals.applyRoutes = function (server, next) {

    var Account = server.plugins['hapi-mongo-models'].Account;
    var User = server.plugins['hapi-mongo-models'].User;
    var Status = server.plugins['hapi-mongo-models'].Status;


    server.route({
        method: 'GET',
        path: '/accounts',
        config: {
            auth: {
                strategy: 'simple',
                scope: 'admin'
            },
            validate: {
                query: {
                    fields: Joi.string(),
                    sort: Joi.string().default('_id'),
                    limit: Joi.number().default(20),
                    page: Joi.number().default(1)
                }
            }
        },
        handler: function (request, reply) {

            var query = {};
            var fields = request.query.fields;
            var sort = request.query.sort;
            var limit = request.query.limit;
            var page = request.query.page;

            Account.pagedFind(query, fields, sort, limit, page, function (err, results) {

                if (err) {
                    return reply(err);
                }

                reply(results);
            });
        }
    });


    server.route({
        method: 'GET',
        path: '/accounts/{id}',
        config: {
            auth: {
                strategy: 'simple',
                scope: 'admin'
            }
        },
        handler: function (request, reply) {

            Account.findById(request.params.id, function (err, account) {

                if (err) {
                    return reply(err);
                }

                if (!account) {
                    return reply(Boom.notFound('Document not found.'));
                }

                reply(account);
            });
        }
    });


    server.route({
        method: 'GET',
        path: '/accounts/my',
        config: {
            auth: {
                strategy: 'simple',
                scope: 'account'
            }
        },
        handler: function (request, reply) {

            var id = request.auth.credentials.roles.account._id.toString();
            var fields = Account.fieldsAdapter('user name timeCreated');

            Account.findById(id, fields, function (err, account) {

                if (err) {
                    return reply(err);
                }

                if (!account) {
                    return reply(Boom.notFound('Document not found. That is strange.'));
                }

                reply(account);
            });
        }
    });


    server.route({
        method: 'POST',
        path: '/accounts',
        config: {
            auth: {
                strategy: 'simple',
                scope: 'admin'
            },
            validate: {
                payload: {
                    name: Joi.string().required()
                }
            }
        },
        handler: function (request, reply) {

            var name = request.payload.name;

            Account.create(name, function (err, account) {

                if (err) {
                    return reply(err);
                }

                reply(account);
            });
        }
    });


    server.route({
        method: 'PUT',
        path: '/accounts/{id}',
        config: {
            auth: {
                strategy: 'simple',
                scope: 'admin'
            },
            validate: {
                payload: {
                    name: Joi.object().keys({
                        first: Joi.string().required(),
                        middle: Joi.string().allow(''),
                        last: Joi.string().required()
                    }).required()
                }
            }
        },
        handler: function (request, reply) {

            var id = request.params.id;
            var update = {
                $set: {
                    name: request.payload.name
                }
            };

            Account.findByIdAndUpdate(id, update, function (err, account) {

                if (err) {
                    return reply(err);
                }

                if (!account) {
                    return reply(Boom.notFound('Document not found.'));
                }

                reply(account);
            });
        }
    });


    server.route({
        method: 'PUT',
        path: '/accounts/my',
        config: {
            auth: {
                strategy: 'simple',
                scope: 'account'
            },
            validate: {
                payload: {
                    name: Joi.object().keys({
                        first: Joi.string().required(),
                        middle: Joi.string().allow(''),
                        last: Joi.string().required()
                    }).required()
                }
            }
        },
        handler: function (request, reply) {

            var id = request.auth.credentials.roles.account._id.toString();
            var update = {
                $set: {
                    name: request.payload.name
                }
            };
            var findOptions = {
                fields: Account.fieldsAdapter('user name timeCreated')
            };

            Account.findByIdAndUpdate(id, update, findOptions, function (err, account) {

                if (err) {
                    return reply(err);
                }

                reply(account);
            });
        }
    });


    server.route({
        method: 'PUT',
        path: '/accounts/{id}/user',
        config: {
            auth: {
                strategy: 'simple',
                scope: 'admin'
            },
            validate: {
                payload: {
                    username: Joi.string().lowercase().required()
                }
            },
            pre: [{
                assign: 'account',
                method: function (request, reply) {

                    Account.findById(request.params.id, function (err, account) {

                        if (err) {
                            return reply(err);
                        }

                        if (!account) {
                            return reply(Boom.notFound('Document not found.'));
                        }

                        reply(account);
                    });
                }
            }, {
                assign: 'user',
                method: function (request, reply) {

                    User.findByUsername(request.payload.username, function (err, user) {

                        if (err) {
                            return reply(err);
                        }

                        if (!user) {
                            return reply(Boom.notFound('User document not found.'));
                        }

                        if (user.roles &&
                            user.roles.account &&
                            user.roles.account.id !== request.params.id) {

                            return reply(Boom.conflict('User is already linked to another account. Unlink first.'));
                        }

                        reply(user);
                    });
                }
            }, {
                assign: 'userCheck',
                method: function (request, reply) {

                    if (request.pre.account.user &&
                        request.pre.account.user.id !== request.pre.user._id.toString()) {

                        return reply(Boom.conflict('Account is already linked to another user. Unlink first.'));
                    }

                    reply(true);
                }
            }]
        },
        handler: function (request, reply) {

            Async.auto({
                account: function (done) {

                    var id = request.params.id;
                    var update = {
                        $set: {
                            user: {
                                id: request.pre.user._id.toString(),
                                name: request.pre.user.username
                            }
                        }
                    };

                    Account.findByIdAndUpdate(id, update, done);
                },
                user: function (done) {

                    var id = request.pre.user._id;
                    var update = {
                        $set: {
                            'roles.account': {
                                id: request.pre.account._id.toString(),
                                name: request.pre.account.name.first + ' ' + request.pre.account.name.last
                            }
                        }
                    };

                    User.findByIdAndUpdate(id, update, done);
                }
            }, function (err, results) {

                if (err) {
                    return reply(err);
                }

                reply(results.account);
            });
        }
    });


    server.route({
        method: 'DELETE',
        path: '/accounts/{id}/user',
        config: {
            auth: {
                strategy: 'simple',
                scope: 'admin'
            },
            pre: [{
                assign: 'account',
                method: function (request, reply) {

                    Account.findById(request.params.id, function (err, account) {

                        if (err) {
                            return reply(err);
                        }

                        if (!account) {
                            return reply(Boom.notFound('Document not found.'));
                        }

                        if (!account.user || !account.user.id) {
                            return reply(account).takeover();
                        }

                        reply(account);
                    });
                }
            }, {
                assign: 'user',
                method: function (request, reply) {

                    User.findById(request.pre.account.user.id, function (err, user) {

                        if (err) {
                            return reply(err);
                        }

                        if (!user) {
                            return reply(Boom.notFound('User document not found.'));
                        }

                        reply(user);
                    });
                }
            }]
        },
        handler: function (request, reply) {

            Async.auto({
                account: function (done) {

                    var id = request.params.id;
                    var update = {
                        $unset: {
                            user: undefined
                        }
                    };

                    Account.findByIdAndUpdate(id, update, done);
                },
                user: function (done) {

                    var id = request.pre.user._id.toString();
                    var update = {
                        $unset: {
                            'roles.account': undefined
                        }
                    };

                    User.findByIdAndUpdate(id, update, done);
                }
            }, function (err, results) {

                if (err) {
                    return reply(err);
                }

                reply(results.account);
            });
        }
    });


    server.route({
        method: 'POST',
        path: '/accounts/{id}/notes',
        config: {
            auth: {
                strategy: 'simple',
                scope: 'admin'
            },
            validate: {
                payload: {
                    data: Joi.string().required()
                }
            }
        },
        handler: function (request, reply) {

            var id = request.params.id;
            var update = {
                $push: {
                    notes: {
                        data: request.payload.data,
                        timeCreated: new Date(),
                        userCreated: {
                            id: request.auth.credentials.user._id.toString(),
                            name: request.auth.credentials.user.username
                        }
                    }
                }
            };

            Account.findByIdAndUpdate(id, update, function (err, account) {

                if (err) {
                    return reply(err);
                }

                reply(account);
            });
        }
    });


    server.route({
        method: 'POST',
        path: '/accounts/{id}/status',
        config: {
            auth: {
                strategy: 'simple',
                scope: 'admin'
            },
            validate: {
                payload: {
                    status: Joi.string().required()
                }
            },
            pre: [{
                assign: 'status',
                method: function (request, reply) {

                    Status.findById(request.payload.status, function (err, status) {

                        if (err) {
                            return reply(err);
                        }

                        reply(status);
                    });
                }
            }]
        },
        handler: function (request, reply) {

            var id = request.params.id;
            var newStatus = {
                id: request.pre.status._id.toString(),
                name: request.pre.status.name,
                timeCreated: new Date(),
                userCreated: {
                    id: request.auth.credentials.user._id.toString(),
                    name: request.auth.credentials.user.username
                }
            };
            var update = {
                $set: {
                    'status.current': newStatus
                },
                $push: {
                    'status.log': newStatus
                }
            };

            Account.findByIdAndUpdate(id, update, function (err, account) {

                if (err) {
                    return reply(err);
                }

                reply(account);
            });
        }
    });


    server.route({
        method: 'DELETE',
        path: '/accounts/{id}',
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

            Account.findByIdAndDelete(request.params.id, function (err, account) {

                if (err) {
                    return reply(err);
                }

                if (!account) {
                    return reply(Boom.notFound('Document not found.'));
                }

                reply({ message: 'Success.' });
            });
        }
    });


    next();
};


exports.register = function (server, options, next) {

    server.dependency(['auth', 'hapi-mongo-models'], internals.applyRoutes);

    next();
};


exports.register.attributes = {
    name: 'account'
};
