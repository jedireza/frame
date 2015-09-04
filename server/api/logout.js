var Hoek = require('hoek');


exports.register = function (server, options, next) {

    server.route({
        method: 'DELETE',
        path: '/logout',
        config: {
            auth: {
                mode: 'try',
                strategy: 'simple'
            }
        },
        handler: function (request, reply) {

            var Session = request.server.plugins['hapi-mongo-models'].Session;
            var credentials = request.auth.credentials || { session: {} };
            var session = credentials.session || {};

            Session.findByIdAndDelete(session._id, function (err, sessionDoc) {

                if (err) {
                    return reply(err);
                }

                if (!sessionDoc) {
                    return reply({ message: 'Session not found.' }).code(404);
                }

                reply({ message: 'Success.' });
            });
        }
    });


    next();
};


exports.register.attributes = {
    name: 'logout'
};
