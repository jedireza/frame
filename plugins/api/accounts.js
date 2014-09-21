var async = require('async');
var Joi = require('joi');
var authPlugin = require('../auth');


exports.register = function (plugin, options, next) {

    plugin.route({
        method: 'GET',
        path: '/accounts',
        config: {
            auth: 'simple',
            validate: {
                query: {
                    fields: Joi.string(),
                    sort: Joi.string(),
                    limit: Joi.number().default(20),
                    page: Joi.number().default(1)
                }
            },
            pre: [
                authPlugin.preware.ensureUserRole('admin'),
                authPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            var Account = request.server.plugins.models.Account;
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


    plugin.route({
        method: 'GET',
        path: '/accounts/{id}',
        config: {
            auth: 'simple',
            pre: [
                authPlugin.preware.ensureUserRole('admin'),
                authPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            var Account = request.server.plugins.models.Account;

            Account.findById(request.params.id, function (err, account) {

                if (err) {
                    return reply(err);
                }

                if (!account) {
                    return reply({ message: 'Document not found.' }).code(404);
                }

                reply(account);
            });
        }
    });


    plugin.route({
        method: 'GET',
        path: '/accounts/my',
        config: {
            auth: 'simple',
            pre: [
                authPlugin.preware.ensureUserRole('account'),
            ]
        },
        handler: function (request, reply) {

            var Account = request.server.plugins.models.Account;
            var id = request.auth.credentials.roles.account._id.toString();
            var fields = Account.fieldsAdapter('user name timeCreated');

            Account.findById(id, fields, function (err, account) {

                if (err) {
                    return reply(err);
                }

                if (!account) {
                    return reply({ message: 'Document not found. That is strange.' }).code(404);
                }

                reply(account);
            });
        }
    });


    plugin.route({
        method: 'POST',
        path: '/accounts',
        config: {
            auth: 'simple',
            validate: {
                payload: {
                    name: Joi.string().required()
                }
            },
            pre: [
                authPlugin.preware.ensureUserRole('admin'),
                authPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            var Account = request.server.plugins.models.Account;
            var name = request.payload.name;

            Account.create(name, function (err, account) {

                if (err) {
                    return reply(err);
                }

                reply(account);
            });
        }
    });


    plugin.route({
        method: 'PUT',
        path: '/accounts/{id}',
        config: {
            auth: 'simple',
            validate: {
                payload: {
                    name: Joi.object().keys({
                        first: Joi.string().required(),
                        middle: Joi.string().allow(''),
                        last: Joi.string().required()
                    }).required()
                }
            },
            pre: [
                authPlugin.preware.ensureUserRole('admin'),
                authPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            var Account = request.server.plugins.models.Account;
            var id = request.params.id;
            var update = {
                $set: {
                    name: request.payload.name.first
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


    plugin.route({
        method: 'PUT',
        path: '/accounts/my',
        config: {
            auth: 'simple',
            validate: {
                payload: {
                    name: Joi.object().keys({
                        first: Joi.string().required(),
                        middle: Joi.string().allow(''),
                        last: Joi.string().required()
                    }).required()
                }
            },
            pre: [
                authPlugin.preware.ensureUserRole('account')
            ]
        },
        handler: function (request, reply) {

            var Account = request.server.plugins.models.Account;
            var id = request.auth.credentials.roles.account._id.toString();
            var update = {
                $set: {
                    name: request.payload.name
                }
            };
            var options = {
                fields: Account.fieldsAdapter('user name timeCreated')
            };

            Account.findByIdAndUpdate(id, update, options, function (err, account) {

                if (err) {
                    return reply(err);
                }

                reply(account);
            });
        }
    });


    plugin.route({
        method: 'PUT',
        path: '/accounts/{id}/user',
        config: {
            auth: 'simple',
            validate: {
                payload: {
                    username: Joi.string().required()
                }
            },
            pre: [
                authPlugin.preware.ensureUserRole('admin'),
                authPlugin.preware.ensureAdminGroup('root'),
                {
                    assign: 'account',
                    method: function (request, reply) {

                        var Account = request.server.plugins.models.Account;

                        Account.findById(request.params.id, function (err, account) {

                            if (err) {
                                return reply(err);
                            }

                            if (!account) {
                                return reply({ message: 'Document not found.' }).takeover().code(404);
                            }

                            reply(account);
                        });
                    }
                },{
                    assign: 'user',
                    method: function (request, reply) {

                        var User = request.server.plugins.models.User;

                        User.findByUsername(request.payload.username, function (err, user) {

                            if (err) {
                                return reply(err);
                            }

                            if (!user) {
                                return reply({ message: 'User document not found.' }).takeover().code(404);
                            }

                            if (user.roles &&
                                    user.roles.account &&
                                    user.roles.account.id !== request.params.id) {

                                var response = {
                                    message: 'User is already linked to another account. Unlink first.'
                                };

                                return reply(response).takeover().code(409);
                            }

                            reply(user);
                        });
                    }
                },{
                    assign: 'userCheck',
                    method: function (request, reply) {

                        if (request.pre.account.user &&
                            request.pre.account.user.id !== request.pre.user._id.toString()) {

                            var response = {
                                message: 'Account is already linked to another user. Unlink first.'
                            };

                            return reply(response).takeover().code(409);
                        }

                        reply(true);
                    }
                }
            ]
        },
        handler: function (request, reply) {

            async.auto({
                account: function (done) {

                    var Account = request.server.plugins.models.Account;
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

                    var User = request.server.plugins.models.User;
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

                reply(results.account[0]);
            });
        }
    });


    plugin.route({
        method: 'DELETE',
        path: '/accounts/{id}/user',
        config: {
            auth: 'simple',
            pre: [
                authPlugin.preware.ensureUserRole('admin'),
                authPlugin.preware.ensureAdminGroup('root'),
                {
                    assign: 'account',
                    method: function (request, reply) {

                        var Account = request.server.plugins.models.Account;

                        Account.findById(request.params.id, function (err, account) {

                            if (err) {
                                return reply(err);
                            }

                            if (!account) {
                                return reply({ message: 'Document not found.' }).takeover().code(404);
                            }

                            if (!account.user || !account.user.id) {
                                return reply(account).takeover();
                            }

                            reply(account);
                        });
                    }
                },{
                    assign: 'user',
                    method: function (request, reply) {

                        var User = request.server.plugins.models.User;

                        User.findById(request.pre.account.user.id, function (err, user) {

                            if (err) {
                                return reply(err);
                            }

                            if (!user) {
                                return reply({ message: 'User document not found.' }).takeover().code(404);
                            }

                            reply(user);
                        });
                    }
                }
            ]
        },
        handler: function (request, reply) {

            async.auto({
                account: function (done) {

                    var Account = request.server.plugins.models.Account;
                    var id = request.params.id;
                    var update = {
                        $unset: {
                            user: undefined
                        }
                    };

                    Account.findByIdAndUpdate(id, update, done);
                },
                user: function (done) {

                    var User = request.server.plugins.models.User;
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

                reply(results.account[0]);
            });
        }
    });


    plugin.route({
        method: 'POST',
        path: '/accounts/{id}/notes',
        config: {
            auth: 'simple',
            validate: {
                payload: {
                    data: Joi.string().required()
                }
            },
            pre: [
                authPlugin.preware.ensureUserRole('admin')
            ]
        },
        handler: function (request, reply) {

            var Account = request.server.plugins.models.Account;
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


    plugin.route({
        method: 'POST',
        path: '/accounts/{id}/status',
        config: {
            auth: 'simple',
            validate: {
                payload: {
                    status: Joi.string().required()
                }
            },
            pre: [
                authPlugin.preware.ensureUserRole('admin'),
                {
                    assign: 'status',
                    method: function (request, reply) {

                        var Status = request.server.plugins.models.Status;

                        Status.findById(request.payload.status, function (err, status) {

                            if (err) {
                                return reply(err);
                            }

                            reply(status);
                        });
                    }
                }
            ]
        },
        handler: function (request, reply) {

            var Account = request.server.plugins.models.Account;
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


    plugin.route({
        method: 'DELETE',
        path: '/accounts/{id}',
        config: {
            auth: 'simple',
            pre: [
                authPlugin.preware.ensureUserRole('admin'),
                authPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            var Account = request.server.plugins.models.Account;

            Account.findByIdAndRemove(request.params.id, function (err, count) {

                if (err) {
                    return reply(err);
                }

                if (count === 0) {
                    return reply({ message: 'Document not found.' }).code(404);
                }

                reply({ message: 'Success.' });
            });
        }
    });


    next();
};
exports.register.attributes = {
    name: 'account'
};
