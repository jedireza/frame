var Boom = require('boom');
var Joi = require('joi');
var Hoek = require('hoek');
var AuthPlugin = require('../auth');


var internals = {};


internals.applyRoutes = function (server, next) {

    var AdminGroup = server.plugins['hapi-mongo-models'].AdminGroup;


    server.route({
        method: 'GET',
        path: '/admin-groups',
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
            },
            pre: [
                AuthPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            var query = {};
            var fields = request.query.fields;
            var sort = request.query.sort;
            var limit = request.query.limit;
            var page = request.query.page;

            AdminGroup.pagedFind(query, fields, sort, limit, page, function (err, results) {

                if (err) {
                    return reply(err);
                }

                reply(results);
            });
        }
    });


    server.route({
        method: 'GET',
        path: '/admin-groups/{id}',
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

            AdminGroup.findById(request.params.id, function (err, adminGroup) {

                if (err) {
                    return reply(err);
                }

                if (!adminGroup) {
                    return reply(Boom.notFound('Document not found.'));
                }

                reply(adminGroup);
            });
        }
    });


    server.route({
        method: 'POST',
        path: '/admin-groups',
        config: {
            auth: {
                strategy: 'simple',
                scope: 'admin'
            },
            validate: {
                payload: {
                    name: Joi.string().required()
                }
            },
            pre: [
                AuthPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            var name = request.payload.name;

            AdminGroup.create(name, function (err, adminGroup) {

                if (err) {
                    return reply(err);
                }

                reply(adminGroup);
            });
        }
    });


    server.route({
        method: 'PUT',
        path: '/admin-groups/{id}',
        config: {
            auth: {
                strategy: 'simple',
                scope: 'admin'
            },
            validate: {
                payload: {
                    name: Joi.string().required()
                }
            },
            pre: [
                AuthPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            var id = request.params.id;
            var update = {
                $set: {
                    name: request.payload.name
                }
            };

            AdminGroup.findByIdAndUpdate(id, update, function (err, adminGroup) {

                if (err) {
                    return reply(err);
                }

                if (!adminGroup) {
                    return reply(Boom.notFound('Document not found.'));
                }

                reply(adminGroup);
            });
        }
    });


    server.route({
        method: 'PUT',
        path: '/admin-groups/{id}/permissions',
        config: {
            auth: {
                strategy: 'simple',
                scope: 'admin'
            },
            validate: {
                payload: {
                    permissions: Joi.object().required()
                }
            },
            pre: [
                AuthPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            var id = request.params.id;
            var update = {
                $set: {
                    permissions: request.payload.permissions
                }
            };

            AdminGroup.findByIdAndUpdate(id, update, function (err, adminGroup) {

                if (err) {
                    return reply(err);
                }

                reply(adminGroup);
            });
        }
    });


    server.route({
        method: 'DELETE',
        path: '/admin-groups/{id}',
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

            AdminGroup.findByIdAndDelete(request.params.id, function (err, adminGroup) {

                if (err) {
                    return reply(err);
                }

                if (!adminGroup) {
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
    name: 'admin-groups'
};
