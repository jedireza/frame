'use strict';
const Session = require('../models/session');


const register = function (server, serverOptions) {

    server.route({
        method: 'DELETE',
        path: '/api/logout',
        options: {
            tags: ['api','logout'],
            auth: {
                mode: 'try'
            }
        },
        handler: function (request, h) {

            const credentials = request.auth.credentials;

            if (!credentials) {
                return { message: 'Success.' };
            }

            Session.findByIdAndDelete(credentials.session._id);

            return { message: 'Success.' };
        }
    });
};


module.exports = {
    name: 'api-logout',
    dependencies: [
        'auth',
        'hapi-auth-basic',
        'hapi-mongo-models'
    ],
    register
};
