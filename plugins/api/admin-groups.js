var Joi = require('joi');
var authPlugin = require('../auth');


exports.register = function (plugin, options, next) {

    plugin.route({
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
                    sort: Joi.string(),
                    limit: Joi.number().default(20),
                    page: Joi.number().default(1)
                }
            },
            pre: [
                authPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            var AdminGroup = request.server.plugins.models.AdminGroup;
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


    plugin.route({
        method: 'GET',
        path: '/admin-groups/{id}',
        config: {
            auth: {
                strategy: 'simple',
                scope: 'admin'
            },
            pre: [
                authPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            var AdminGroup = request.server.plugins.models.AdminGroup;

            AdminGroup.findById(request.params.id, function (err, adminGroup) {

                if (err) {
                    return reply(err);
                }

                if (!adminGroup) {
                    return reply({ message: 'Document not found.' }).code(404);
                }

                reply(adminGroup);
            });
        }
    });


    plugin.route({
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
                authPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            var AdminGroup = request.server.plugins.models.AdminGroup;
            var name = request.payload.name;

            AdminGroup.create(name, function (err, adminGroup) {

                if (err) {
                    return reply(err);
                }

                reply(adminGroup);
            });
        }
    });


    plugin.route({
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
                authPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            var AdminGroup = request.server.plugins.models.AdminGroup;
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

                reply(adminGroup);
            });
        }
    });


    plugin.route({
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
                authPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            var AdminGroup = request.server.plugins.models.AdminGroup;
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


    plugin.route({
        method: 'DELETE',
        path: '/admin-groups/{id}',
        config: {
            auth: {
                strategy: 'simple',
                scope: 'admin'
            },
            pre: [
                authPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            var AdminGroup = request.server.plugins.models.AdminGroup;

            AdminGroup.findByIdAndRemove(request.params.id, function (err, count) {

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
    name: 'admin-groups'
};
