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
                        version: Package.version,
                        description: `Check out the **[Github Wiki](https://github.com/jedireza/frame/wiki)** for common questions and how-tos.
   
A few key things to be aware of:   
The core User model found in the /api/users/ endpoints have these basic fields: _id, email, username, password, isActive, roles, timeCreated.
   
This framework decorates the core User models with additional role specific fields via mapping it to 1 or more roles. Frame comes with 2 default roles, customers and admins.    

/api/accounts/ is the "customer account" role.    
When users sign up via /api/signup the framework automatically creates a new User and a new Account (aka customer role) and links the two. Users can have multiple roles but each new instance of a role model can only be mapped to one user.
The customer Account role adds these additional fields for users who are customers: "name" (first, middle last), "notes", and "status". "Notes" allows admins to add notes to accounts.
   
/api/admins/ is the "admin" role.   
This role contains a "name" (first, middle, last), "permissions", and "groups" property allowing you to assign multiple admin-groups. The first admin-group is "root" which is allowed to perform the "Root Scope" actions.

More details on [Users, Roles & Groups](https://github.com/jedireza/frame/wiki/Users,-Roles-&-Groups)   
More details on [Admin & Admin Group Permissions](https://github.com/jedireza/frame/wiki/Admin-&-Admin-Group-Permissions)`
                    },
                    grouping: 'tags',
                    sortTags: 'name',
                    tags: [
                        {
                            name: 'accounts',
                            description: 'endpoints to interact with customer role.'
                        },{
                            name: 'admin-groups',
                            description: 'endpoints to interact with admin groups.'
                        },{
                            name: 'admins',
                            description: 'endpoints to interact with admin roles.'
                        },{
                            name: 'contact'
                        },{
                            name: 'login',
                            description: 'endpoints for login flow.'
                        },{
                            name: 'logout'
                        },{
                            name: 'main'
                        },{
                            name: 'session',
                            description: 'endpoints to interact with user sessions.'
                        },{
                            name: 'signup'
                        },{
                            name: 'statuses',
                            description: 'endpoints to interact with customer role (account) statuses.'
                        },{
                            name: 'users',
                            description: 'endpoints to interact with users (outside of roles)'
                        }
                    ]
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
