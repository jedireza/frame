#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var async = require('async');
var promptly = require('promptly');
var mongodb = require('mongodb');
var handlebars = require('handlebars');

if (process.env.NODE_ENV === 'test') {
    var configTemplatePath = path.resolve(__dirname, 'config.example.js');
    var configPath = path.resolve(__dirname, 'config.js');
    var options = { encoding: 'utf-8' };
    var source = fs.readFileSync(configTemplatePath, options);
    var configTemplate = handlebars.compile(source);
    var context = {
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
    fs.writeFileSync(configPath, configTemplate(context));
    console.log('Setup complete.');
    process.exit(0);
}

async.auto({
    projectName: function (done) {

        promptly.prompt('Project name: (Frame)', { default: 'Frame' }, done);
    },
    mongodbUrl: ['projectName', function (done, results) {

        var options = {
            default: 'mongodb://localhost:27017/frame'
        };

        promptly.prompt('MongoDB URL: (mongodb://localhost:27017/frame)', options, done);
    }],
    testMongo: ['rootPassword', function (done, results) {

        mongodb.MongoClient.connect(results.mongodbUrl, {}, function (err, db) {

            if (err) {
                console.error('Failed to connect to MongoDB.');
                return done(err);
            }

            db.close();
            done(null, true);
        });
    }],
    rootEmail: ['mongodbUrl', function (done, results) {

        promptly.prompt('Root user email:', done);
    }],
    rootPassword: ['rootEmail', function (done, results) {

        promptly.password('Root user password:', { default: null }, done);
    }],
    systemEmail: ['rootPassword', function (done, results) {

        var options = {
            default: results.rootEmail
        };

        promptly.prompt('System email: (' + results.rootEmail + ')', options, done);
    }],
    smtpHost: ['systemEmail', function (done, results) {

        promptly.prompt('SMTP host: (smtp.gmail.com)', { default: 'smtp.gmail.com' }, done);
    }],
    smtpPort: ['smtpHost', function (done, results) {

        promptly.prompt('SMTP port: (465)', { default: 465 }, done);
    }],
    smtpUsername: ['smtpPort', function (done, results) {

        var options = {
            default: results.systemEmail
        };

        promptly.prompt('SMTP username: (' + results.systemEmail + ')', options, done);
    }],
    smtpPassword: ['smtpUsername', function (done, results) {

        promptly.password('SMTP password:', done);
    }],
    createConfig: ['smtpPassword', function (done, results) {

        var configTemplatePath = path.resolve(__dirname, 'config.example.js');
        var configPath = path.resolve(__dirname, 'config.js');
        var options = { encoding: 'utf-8' };

        fs.readFile(configTemplatePath, options, function (err, source) {

            if (err) {
                console.error('Failed to read config template.');
                return done(err);
            }

            var configTemplate = handlebars.compile(source);
            fs.writeFile(configPath, configTemplate(results), done);
        });
    }],
    setupRootUser: ['createConfig', function (done, results) {

        var BaseModel = require('./models/base');
        var User = require('./models/user');
        var Admin = require('./models/admin');
        var AdminGroup = require('./models/admin-group');

        async.auto({
            connect: function (done) {

                BaseModel.connect(done);
            },
            clean: ['connect', function (done) {

                async.parallel([
                    User.remove.bind(User, {}),
                    Admin.remove.bind(Admin, {}),
                    AdminGroup.remove.bind(AdminGroup, {})
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

                var id = dbResults.admin._id.toString();
                var update = {
                    $set: {
                        groups: {
                            root: 'Root'
                        }
                    }
                };

                Admin.findByIdAndUpdate(id, update, done);
            }],
            linkUser: ['admin', 'user', function (done, dbResults) {

                var id = dbResults.user._id.toString();
                var update = {
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

                var id = dbResults.admin._id.toString();
                var update = {
                    $set: {
                        user: {
                            id: dbResults.user._id.toString(),
                            name: 'root'
                        }
                    }
                };

                Admin.findByIdAndUpdate(id, update, done);
            }],
        }, function (err, dbResults) {

            if (err) {
                console.error('Failed to setup root user.');
                return done(err);
            }

            done(null, true);
        });
    }]
}, function (err, results) {

    if (err) {
        console.error('Setup failed.');
        console.error(err);
        return process.exit(1);
    }

    console.log('Setup complete.');
    process.exit(0);
});
