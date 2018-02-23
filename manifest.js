'use strict';
const Confidence = require('confidence');
const Config = require('./config');
const Package = require('./package.json');
const Path = require('path');


const criteria = {
    env: process.env.NODE_ENV
};


const manifest = {
    $meta: 'This file defines the plot device.',
    server: {
        debug: {
            request: ['error']
        },
        routes: {
            security: true
        },
        port: Config.get('/port/web')
    },
    register: {
        plugins: [
            {
                plugin: 'good',
                options: {
                    reporters: {
                        myConsoleReporter: [
                            {
                                module: 'good-squeeze',
                                name: 'Squeeze',
                                args: [{
                                    error: '*',
                                    log: '*',
                                    request: '*',
                                    response:'*'
                                }]
                            },
                            {
                                module: 'good-console',
                                args: [{
                                    color: {
                                        $filter: 'env',
                                        production: false,
                                        $default: true
                                    }
                                }]
                            },
                            'stdout'
                        ]
                    }
                }
            },
            {
                plugin: 'hapi-auth-basic'
            },
            {
                plugin: 'hapi-remote-address'
            },
            {
                plugin: 'inert'
            },
            {
                plugin: 'vision'
            },
            {
                plugin:'hapi-swagger',
                options: {
                    info: {
                        title: 'Frame API Documentation',
                        version: Package.version
                    },
                    grouping: 'tags',
                    sortTags: 'name'
                }
            },
            {
                plugin: 'hapi-mongo-models',
                options: {
                    mongodb: Config.get('/hapiMongoModels/mongodb'),
                    models: [
                        Path.resolve(__dirname, './server/models/account'),
                        Path.resolve(__dirname, './server/models/admin-group'),
                        Path.resolve(__dirname, './server/models/admin'),
                        Path.resolve(__dirname, './server/models/auth-attempt'),
                        Path.resolve(__dirname, './server/models/session'),
                        Path.resolve(__dirname, './server/models/status'),
                        Path.resolve(__dirname, './server/models/user')
                    ],
                    autoIndex: Config.get('/hapiMongoModels/autoIndex')
                }
            },
            {
                plugin: './server/auth'
            },
            {
                plugin: './server/api/accounts'
            },
            {
                plugin: './server/api/admin-groups'
            },
            {
                plugin: './server/api/admins'
            },
            {
                plugin: './server/api/contact'
            },
            {
                plugin: './server/api/main'
            },
            {
                plugin: './server/api/login'
            },
            {
                plugin: './server/api/logout'
            },
            {
                plugin: './server/api/sessions'
            },
            {
                plugin: './server/api/signup'
            },
            {
                plugin: './server/api/statuses'
            },
            {
                plugin: './server/api/users'
            },
            {
                plugin: './server/web/main'
            }
        ]
    }
};


const store = new Confidence.Store(manifest);


exports.get = function (key) {

    return store.get(key, criteria);
};


exports.meta = function (key) {

    return store.meta(key, criteria);
};
