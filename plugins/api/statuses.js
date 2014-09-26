var Joi = require('joi');
var authPlugin = require('../auth');


exports.register = function (plugin, options, next) {

    plugin.route({
        method: 'GET',
        path: '/statuses',
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

            var Status = request.server.plugins.models.Status;
            var query = {};
            var fields = request.query.fields;
            var sort = request.query.sort;
            var limit = request.query.limit;
            var page = request.query.page;

            Status.pagedFind(query, fields, sort, limit, page, function (err, results) {

                if (err) {
                    return reply(err);
                }

                reply(results);
            });
        }
    });


    plugin.route({
        method: 'GET',
        path: '/statuses/{id}',
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

            var Status = request.server.plugins.models.Status;

            Status.findById(request.params.id, function (err, status) {

                if (err) {
                    return reply(err);
                }

                if (!status) {
                    return reply({ message: 'Document not found.' }).code(404);
                }

                reply(status);
            });
        }
    });


    plugin.route({
        method: 'POST',
        path: '/statuses',
        config: {
            auth: {
                strategy: 'simple',
                scope: 'admin'
            },
            validate: {
                payload: {
                    pivot: Joi.string().required(),
                    name: Joi.string().required()
                }
            },
            pre: [
                authPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            var Status = request.server.plugins.models.Status;
            var pivot = request.payload.pivot;
            var name = request.payload.name;

            Status.create(pivot, name, function (err, status) {

                if (err) {
                    return reply(err);
                }

                reply(status);
            });
        }
    });


    plugin.route({
        method: 'PUT',
        path: '/statuses/{id}',
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

            var Status = request.server.plugins.models.Status;
            var id = request.params.id;
            var update = {
                $set: {
                    name: request.payload.name
                }
            };

            Status.findByIdAndUpdate(id, update, function (err, status) {

                if (err) {
                    return reply(err);
                }

                reply(status);
            });
        }
    });


    plugin.route({
        method: 'DELETE',
        path: '/statuses/{id}',
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

            var Status = request.server.plugins.models.Status;

            Status.findByIdAndRemove(request.params.id, function (err, count) {

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
    name: 'statuses'
};
