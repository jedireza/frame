var Confidence = require('confidence');
var Config = require('./config');


var criteria = {
    env: process.env.NODE_ENV
};


var manifest = {
    $meta: 'This file defines the plot device.',
    server: {
        debug: {
            request: ['error']
        },
        connections: {
            routes: {
                security: true
            }
        }
    },
    connections: [{
        port: Config.get('/port/web'),
        labels: ['web']
    }],
    plugins: {
        'hapi-auth-basic': {},
        'lout': {},
        'inert': {},
        'vision': {},
        'visionary': {
            engines: { jade: 'jade' },
            path: './server/web'
        },
        'hapi-mongo-models': {
            mongodb: Config.get('/hapiMongoModels/mongodb'),
            models: {
                Account: './server/models/account',
                AdminGroup: './server/models/admin-group',
                Admin: './server/models/admin',
                AuthAttempt: './server/models/auth-attempt',
                Session: './server/models/session',
                Status: './server/models/status',
                User: './server/models/user'
            },
            autoIndex: Config.get('/hapiMongoModels/autoIndex')
        },
        './server/auth': {},
        './server/mailer': {},
        './server/api/accounts': [{ routes: { prefix: '/api' } }],
        './server/api/admin-groups': [{ routes: { prefix: '/api' } }],
        './server/api/admins': [{ routes: { prefix: '/api' } }],
        './server/api/auth-attempts': [{ routes: { prefix: '/api' } }],
        './server/api/contact': [{ routes: { prefix: '/api' } }],
        './server/api/index': [{ routes: { prefix: '/api' } }],
        './server/api/login': [{ routes: { prefix: '/api' } }],
        './server/api/logout': [{ routes: { prefix: '/api' } }],
        './server/api/sessions': [{ routes: { prefix: '/api' } }],
        './server/api/signup': [{ routes: { prefix: '/api' } }],
        './server/api/statuses': [{ routes: { prefix: '/api' } }],
        './server/api/users': [{ routes: { prefix: '/api' } }],
        './server/web/index': {}
    }
};


var store = new Confidence.Store(manifest);


exports.get = function (key) {

    return store.get(key, criteria);
};


exports.meta = function (key) {

    return store.meta(key, criteria);
};
