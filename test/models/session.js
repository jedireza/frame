var async = require('async');
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var proxyquire = require('proxyquire');
var stub = {
    bcrypt: {}
};
var Session = proxyquire('../../models/session', { bcrypt: stub.bcrypt });


lab.experiment('Session Class Methods', function () {

    lab.before(function (done) {

        Session.connect(function (err, db) {

            done(err);
        });
    });


    lab.after(function (done) {

        Session.remove({}, function (err, result) {

            Session.disconnect();

            done(err);
        });
    });


    lab.test('it creates a key hash combination', function (done) {

        Session.generateKeyHash(function (err, result) {

            Lab.expect(err).to.not.be.ok;
            Lab.expect(result).to.be.an('object');
            Lab.expect(result.key).to.be.a('string');
            Lab.expect(result.hash).to.be.a('string');

            done();
        });
    });


    lab.test('it returns an error when key hash fails', function (done) {

        var realGenSalt = stub.bcrypt.genSalt;
        stub.bcrypt.genSalt = function (rounds, callback) {

            callback(Error('bcrypt failed'));
        };

        Session.generateKeyHash(function (err, result) {

            Lab.expect(err).to.be.an('object');
            Lab.expect(result).to.not.be.ok;

            stub.bcrypt.genSalt = realGenSalt;

            done();
        });
    });


    lab.test('it returns a new instance when create succeeds', function (done) {

        Session.create('ren', function (err, result) {

            Lab.expect(err).to.not.be.ok;
            Lab.expect(result).to.be.an.instanceOf(Session);

            done();
        });
    });

    lab.test('it returns an error when create fails', function (done) {

        var realInsert = Session.insert;
        Session.insert = function () {

            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();

            callback(Error('insert failed'));
        };

        Session.create('ren', function (err, result) {

            Lab.expect(err).to.be.an('object');
            Lab.expect(result).to.not.be.ok;

            Session.insert = realInsert;

            done();
        });
    });


    lab.test('it returns a result when finding by credentials', function (done) {

        async.auto({
            session: function (cb) {

                Session.create('ren', function (err, result) {

                    Lab.expect(err).to.not.be.ok;
                    Lab.expect(result).to.be.an.instanceOf(Session);

                    cb(null, result);
                });
            }
        }, function (err, results) {

            if (err) {
                return done(err);
            }

            var username = results.session.username;
            var key = results.session.key;

            Session.findByCredentials(username, key, function (err, result) {

                Lab.expect(err).to.not.be.ok;
                Lab.expect(result).to.be.an.instanceOf(Session);

                done();
            });
        });
    });


    lab.test('it returns nothing for find by credentials when key match fails', function (done) {

        var realFindOne = Session.findOne;
        Session.findOne = function () {

            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();

            callback(null, { username: 'toastman', key: 'letmein' });
        };

        var realCompare = stub.bcrypt.compare;
        stub.bcrypt.compare = function (key, source, callback) {

            callback(null, false);
        };

        Session.findByCredentials('toastman', 'doorislocked', function (err, result) {

            Lab.expect(err).to.not.be.ok;
            Lab.expect(result).to.not.be.ok;

            Session.findOne = realFindOne;
            stub.bcrypt.compare = realCompare;

            done();
        });
    });


    lab.test('it returns an error when finding by credentials fails', function (done) {

        var realFindOne = Session.findOne;
        Session.findOne = function () {

            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();

            callback(Error('find one failed'));
        };

        Session.findByCredentials('stimpy', 'dog', function (err, result) {

            Lab.expect(err).to.be.an('object');
            Lab.expect(result).to.not.be.ok;

            Session.findOne = realFindOne;

            done();
        });
    });


    lab.test('it returns early when finding by credentials misses', function (done) {

        var realFindOne = Session.findOne;
        Session.findOne = function () {

            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();

            callback();
        };

        Session.findByCredentials('stimpy', 'dog', function (err, result) {

            Lab.expect(err).to.not.be.ok;
            Lab.expect(result).to.not.be.ok;

            Session.findOne = realFindOne;

            done();
        });
    });
});
