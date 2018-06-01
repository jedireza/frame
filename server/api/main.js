'use strict';


const register = function (server, serverOptions) {

    server.route({
        method: 'GET',
        path: '/api',
        options: {
            tags: ['api','main'],
            description: 'Test if API is accessible. [No Scope]',
            notes: 'Test if API is accessible.',
            auth: false
        },
        handler: function (request, h) {

            return {
                message: 'Welcome to the API.'
            };
        }
    });
};


module.exports = {
    name: 'api-main',
    dependencies: [],
    register
};
