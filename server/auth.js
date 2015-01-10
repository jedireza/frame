var Async = require('async');


exports.register = function (server, options, next) {

    var Session = server.plugins['hapi-mongo-models'].Session;
    var User = server.plugins['hapi-mongo-models'].User;

    server.connections.forEach(function (connection) {

        connection.auth.strategy('simple', 'basic', {
            validateFunc: function (username, password, callback) {

                Async.auto({
                    session: function (done) {

                        Session.findByCredentials(username, password, done);
                    },
                    user: ['session', function (done, results) {

                        if (!results.session) {
                            return done();
                        }

                        User.findByUsername(username, done);
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
                }, function (err, results) {

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
    });

    next();
};


exports.preware = {};


exports.preware.ensureAdminGroup = function (groups) {

    return {
        assign: 'ensureAdminGroup',
        method: function (request, reply) {

            if (Object.prototype.toString.call(groups) !== '[object Array]') {
                groups = [groups];
            }

            var groupFound = groups.some(function (group) {

                return request.auth.credentials.roles.admin.isMemberOf(group);
            });

            if (!groupFound) {
                var response = {
                    message: 'Permission denied to this resource.'
                };

                return reply(response).takeover().code(403);
            }

            reply();
        }
    };
};


exports.register.attributes = {
    name: 'auth'
};
