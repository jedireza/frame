#!/usr/bin/env node
'use strict';

const Fs = require('fs');
const Path = require('path');
const Async = require('async');
const Promptly = require('promptly');
const Mongodb = require('mongodb');
const Handlebars = require('handlebars');


const configTemplatePath = Path.resolve(__dirname, 'config.example');
const configPath = Path.resolve(__dirname, 'config.js');


if (process.env.NODE_ENV === 'test') {
    const options = { encoding: 'utf-8' };
    const source = Fs.readFileSync(configTemplatePath, options);
    const configTemplateTest = Handlebars.compile(source);
    const context = {
        projectName: 'Frame',
        mongodbUrl: 'mongodb://localhost:27017/frame',
        rootEmail: 'root@root',
        rootPassword: 'root',
        systemEmail: 'sys@tem',
        smtpHost: 'smtp.gmail.com',
        smtpPort: 465,
        smtpUsername: '',
        smtpPassword: ''
    };
    Fs.writeFileSync(configPath, configTemplateTest(context));
    console.log('Setup complete.');
    process.exit(0);
}

Async.auto({
    projectName: function (done) {

        Promptly.prompt('Project name: (Frame)', { default: 'Frame' }, done);
    },
    mongodbUrl: ['projectName', (done, results) => {

        const promptOptions = {
            default: 'mongodb://localhost:27017/frame'
        };

        Promptly.prompt('MongoDB URL: (mongodb://localhost:27017/frame)', promptOptions, done);
    }],
    testMongo: ['rootPassword', (done, results) => {

        Mongodb.MongoClient.connect(results.mongodbUrl, {}, (err, db) => {

            if (err) {
                console.error('Failed to connect to Mongodb.');
                return done(err);
            }

            db.close();
            done(null, true);
        });
    }],
    rootEmail: ['mongodbUrl', (done, results) => {

        Promptly.prompt('Root user email:', done);
    }],
    rootPassword: ['rootEmail', (done, results) => {

        Promptly.password('Root user password:', { default: null }, done);
    }],
    systemEmail: ['rootPassword', (done, results) => {

        const promptOptions = {
            default: results.rootEmail
        };

        Promptly.prompt('System email: (' + results.rootEmail + ')', promptOptions, done);
    }],
    smtpHost: ['systemEmail', (done, results) => {

        Promptly.prompt('SMTP host: (smtp.gmail.com)', { default: 'smtp.gmail.com' }, done);
    }],
    smtpPort: ['smtpHost', (done, results) => {

        Promptly.prompt('SMTP port: (465)', { default: 465 }, done);
    }],
    smtpUsername: ['smtpPort', (done, results) => {

        const promptOptions = {
            default: results.systemEmail
        };

        Promptly.prompt('SMTP username: (' + results.systemEmail + ')', promptOptions, done);
    }],
    smtpPassword: ['smtpUsername', (done, results) => {

        Promptly.password('SMTP password:', done);
    }],
    createConfig: ['smtpPassword', (done, results) => {

        const fsOptions = { encoding: 'utf-8' };

        Fs.readFile(configTemplatePath, fsOptions, (err, src) => {

            if (err) {
                console.error('Failed to read config template.');
                return done(err);
            }

            const configTemplate = Handlebars.compile(src);
            Fs.writeFile(configPath, configTemplate(results), done);
        });
    }],
    setupRootUser: ['createConfig', (done, results) => {

        const BaseModel = require('hapi-mongo-models').BaseModel;
        const User = require('./server/models/user');
        const Admin = require('./server/models/admin');
        const AdminGroup = require('./server/models/admin-group');

        Async.auto({
            connect: function (done) {

                BaseModel.connect({ url: results.mongodbUrl }, done);
            },
            clean: ['connect', (done) => {

                Async.parallel([
                    User.deleteMany.bind(User, {}),
                    Admin.deleteMany.bind(Admin, {}),
                    AdminGroup.deleteMany.bind(AdminGroup, {})
                ], done);
            }],
            adminGroup: ['clean', function (done) {

                AdminGroup.create('Root', done);
            }],
            admin: ['clean', function (done) {

                Admin.create('Root Admin', done);
            }],
            user: ['clean', function (done, dbResults) {

                User.create('root', results.rootPassword, results.rootEmail, done);
            }],
            adminMembership: ['admin', function (done, dbResults) {

                const id = dbResults.admin._id.toString();
                const update = {
                    $set: {
                        groups: {
                            root: 'Root'
                        }
                    }
                };

                Admin.findByIdAndUpdate(id, update, done);
            }],
            linkUser: ['admin', 'user', function (done, dbResults) {

                const id = dbResults.user._id.toString();
                const update = {
                    $set: {
                        'roles.admin': {
                            id: dbResults.admin._id.toString(),
                            name: 'Root Admin'
                        }
                    }
                };

                User.findByIdAndUpdate(id, update, done);
            }],
            linkAdmin: ['admin', 'user', function (done, dbResults) {

                const id = dbResults.admin._id.toString();
                const update = {
                    $set: {
                        user: {
                            id: dbResults.user._id.toString(),
                            name: 'root'
                        }
                    }
                };

                Admin.findByIdAndUpdate(id, update, done);
            }]
        }, (err, dbResults) => {

            if (err) {
                console.error('Failed to setup root user.');
                return done(err);
            }

            done(null, true);
        });
    }]
}, (err, results) => {

    if (err) {
        console.error('Setup failed.');
        console.error(err);
        return process.exit(1);
    }

    console.log('Setup complete.');
    process.exit(0);
});
