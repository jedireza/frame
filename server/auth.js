'use strict';

const Boom = require('boom');
const Async = require('async');


const internals = {};


internals.applyStrategy = function (server, next) {

    const Session = server.plugins['hapi-mongo-models'].Session;
    const User = server.plugins['hapi-mongo-models'].User;

    server.auth.strategy('simple', 'basic', {
        validateFunc: function (request, username, password, callback) {

            Async.auto({
                session: function (done) {

                    Session.findByCredentials(username, password, done);
                },
                user: ['session', function (done, results) {

                    if (!results.session) {
                        return done();
                    }

                    User.findById(results.session.userId, done);
                }],
                roles: ['user', function (done, results) {

                    if (!results.user) {
                        return done();
                    }

                    results.user.hydrateRoles(done);
                }],
                scope: ['user', function (done, results) {

                    if (!results.user || !results.user.roles) {
                        return done();
                    }

                    done(null, Object.keys(results.user.roles));
                }]
            }, (err, results) => {

                if (err) {
                    return callback(err);
                }

                if (!results.session) {
                    return callback(null, false);
                }

                callback(null, Boolean(results.user), results);
            });
        }
    });


    next();
};


internals.preware = {
    ensureAdminGroup: function (groups) {

        return {
            assign: 'ensureAdminGroup',
            method: function (request, reply) {

                if (Object.prototype.toString.call(groups) !== '[object Array]') {
                    groups = [groups];
                }

                const groupFound = groups.some((group) => {

                    return request.auth.credentials.roles.admin.isMemberOf(group);
                });

                if (!groupFound) {
                    return reply(Boom.notFound('Permission denied to this resource.'));
                }

                reply();
            }
        };
    }
};


exports.register = function (server, options, next) {

    server.dependency('hapi-mongo-models', internals.applyStrategy);

    next();
};


exports.preware = internals.preware;


exports.register.attributes = {
    name: 'auth'
};
