'use strict';


const register = function (server, options) {

    server.route({
        method: 'GET',
        path: '/',
        options: {
            auth: false
        },
        handler: function (request, h) {

            return '<h1>Welcome to the website.</h1>';
        }
    });
};


module.exports = {
    name: 'web-main',
    dependencies: [],
    register
};
