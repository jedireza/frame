var Async = require('async');
var Joi = require('joi');
var Lab = require('lab');
var Code = require('code');
var ObjectAssign = require('object-assign');
var Proxyquire = require('proxyquire');


var lab = exports.lab = Lab.script();
var stub = {
    mongodb: {},
    config: {}
};
var BaseModel = Proxyquire('../../../server/models/base', {
    mongodb: stub.mongodb,
    '../../config': stub.config
});


lab.experiment('BaseModel DB Connection', function () {

    lab.test('it connects and disconnects the database', function (done) {

        BaseModel.connect(function (err, db) {

            Code.expect(err).to.not.exist();
            Code.expect(db).to.be.an.object();

            Code.expect(BaseModel.db.openCalled).to.equal(true);
            BaseModel.disconnect();
            Code.expect(BaseModel.db.openCalled).to.equal(false);

            done();
        });
    });


    lab.test('it returns an error when the db connection fails', function (done) {

        var realMongoClient = stub.mongodb.MongoClient;

        stub.mongodb.MongoClient = {
            connect: function (url, settings, callback) {

                callback(Error('mongodb is gone'));
            }
        };

        BaseModel.connect(function (err, db) {

            Code.expect(err).to.be.an.object();
            Code.expect(db).to.not.exist();

            stub.mongodb.MongoClient = realMongoClient;

            done();
        });
    });
});


lab.experiment('BaseModel Validation', function () {

    lab.test('it returns the Joi validation results of a SubClass', function (done) {

        var SubModel = BaseModel.extend({
            constructor: function (attrs) {

                ObjectAssign(this, attrs);
            }
        });

        SubModel.schema = Joi.object().keys({
            name: Joi.string().required()
        });

        Code.expect(SubModel.validate()).to.be.an.object();

        done();
    });


    lab.test('it returns the Joi validation results of a SubClass instance', function (done) {

        var SubModel = BaseModel.extend({
            constructor: function (attrs) {

                ObjectAssign(this, attrs);
            }
        });

        SubModel.schema = Joi.object().keys({
            name: Joi.string().required()
        });

        var myModel = new SubModel({name: 'Stimpy'});

        Code.expect(myModel.validate()).to.be.an.object();

        done();
    });
});


lab.experiment('BaseModel Result Factory', function () {

    lab.test('it returns early when an error is present', function (done) {

        var SubModel = BaseModel.extend({
            constructor: function (attrs) {

                ObjectAssign(this, attrs);
            }
        });

        var callback = function (err, result) {

            Code.expect(err).to.be.an.object();
            Code.expect(result).to.not.exist();

            done();
        };

        SubModel.resultFactory(callback, Error('it went boom'), undefined);
    });


    lab.test('it returns an instance for a single result', function (done) {

        var SubModel = BaseModel.extend({
            constructor: function (attrs) {

                ObjectAssign(this, attrs);
            }
        });

        var callback = function (err, result) {

            Code.expect(err).to.not.exist();
            Code.expect(result).to.be.an.instanceOf(SubModel);

            done();
        };

        SubModel.resultFactory(callback, undefined, {name: 'Stimpy'});
    });


    lab.test('it returns an array of instances for a result array', function (done) {

        var SubModel = BaseModel.extend({
            constructor: function (attrs) {

                ObjectAssign(this, attrs);
            }
        });

        var callback = function (err, results) {

            Code.expect(err).to.not.exist();

            results.forEach(function (result) {

                Code.expect(result).to.be.an.instanceOf(SubModel);
            });

            done();
        };

        SubModel.resultFactory(callback, undefined, [{name: 'Ren'}, {name: 'Stimpy'}]);
    });
});


lab.experiment('BaseModel Indexes', function () {

    var SubModel;


    lab.before(function (done) {

        SubModel = BaseModel.extend({
            constructor: function (attrs) {

                ObjectAssign(this, attrs);
            }
        });

        SubModel._collection = 'submodels';

        BaseModel.connect(function (err, db) {

            done(err);
        });
    });


    lab.after(function (done) {

        BaseModel.disconnect();

        done();
    });


    lab.test('it successfully creates an index', function (done) {

        SubModel.ensureIndex({ username: 1 }, {}, function (err, indexName) {

            Code.expect(err).to.not.exist();
            Code.expect(indexName).to.be.a.string();

            done();
        });
    });


    lab.test('it exists early when autoIndex is off', function (done) {

        var realGet = stub.config.get;
        stub.config.get = function (setting) {
            return false;
        };

        SubModel.ensureIndexes();

        SubModel.ensureIndexes(function (err, results) {

            Code.expect(err).to.not.exist();
            Code.expect(results).to.not.exist();

            stub.config.get = realGet;

            done();
        });
    });


    lab.test('it exists early when there are no indexes', function (done) {

        SubModel.ensureIndexes();

        SubModel.ensureIndexes(function (err, results) {

            Code.expect(err).to.not.exist();
            Code.expect(results).to.not.exist();

            done();
        });
    });


    lab.test('it successfully ensures indexes', function (done) {

        SubModel.indexes = [
            [{ foo: 1 }],
            [{ bar: -1 }]
        ];

        SubModel.ensureIndexes(function (err, results) {

            Code.expect(err).to.not.exist();
            Code.expect(results).to.be.an.array();

            done();
        });
    });


    lab.test('it successfully ensures indexes without a callback', function (done) {

        SubModel.indexes = [
            [{ foo: 1 }],
            [{ bar: -1 }]
        ];

        Code.expect(SubModel.ensureIndexes()).to.equal(undefined);

        done();
    });
});


lab.experiment('BaseModel Helpers', function () {

    lab.test('it returns expected results for the fields adapter', function (done) {

        var fieldsDoc = BaseModel.fieldsAdapter('one two three');
        Code.expect(fieldsDoc).to.be.an.object();
        Code.expect(fieldsDoc.one).to.equal(true);
        Code.expect(fieldsDoc.two).to.equal(true);
        Code.expect(fieldsDoc.three).to.equal(true);

        var fieldsDoc2 = BaseModel.fieldsAdapter('');
        Code.expect(Object.keys(fieldsDoc2)).to.have.length(0);

        done();
    });


    lab.test('it returns expected results for the sort adapter', function (done) {

        var sortDoc = BaseModel.sortAdapter('one -two three');
        Code.expect(sortDoc).to.be.an.object();
        Code.expect(sortDoc.one).to.equal(1);
        Code.expect(sortDoc.two).to.equal(-1);
        Code.expect(sortDoc.three).to.equal(1);

        var sortDoc2 = BaseModel.sortAdapter('');
        Code.expect(Object.keys(sortDoc2)).to.have.length(0);

        done();
    });
});


lab.experiment('BaseModel Paged Find', function () {

    var SubModel;


    lab.beforeEach(function (done) {

        SubModel = BaseModel.extend({
            constructor: function (attrs) {

                ObjectAssign(this, attrs);
            }
        });

        SubModel._collection = 'submodels';

        BaseModel.connect(function (err, db) {

            done(err);
        });
    });


    lab.afterEach(function (done) {

        SubModel.remove({}, function (err, result) {

            BaseModel.disconnect();

            done();
        });
    });


    lab.test('it returns early when an error occurs', function (done) {

        var realCount = SubModel.count;
        SubModel.count = function (query, callback) {
            callback(Error('count failed'));
        };

        var query = {};
        var fields;
        var limit = 10;
        var page = 1;
        var sort = { _id: -1 };

        SubModel.pagedFind(query, fields, sort, limit, page, function (err, results) {

            Code.expect(err).to.be.an.object();
            Code.expect(results).to.not.exist();

            SubModel.count = realCount;

            done();
        });
    });


    lab.test('it returns paged results', function (done) {

        Async.auto({
            setup: function (cb) {

                var testData = [{name: 'Ren'}, {name: 'Stimpy'}, {name: 'Yak'}];

                SubModel.insert(testData, cb);
            }
        }, function (err, results) {

            var query = {};
            var fields;
            var limit = 10;
            var page = 1;
            var sort = { _id: -1 };

            SubModel.pagedFind(query, fields, sort, limit, page, function (err, results) {

                Code.expect(err).to.not.exist();
                Code.expect(results).to.be.an.object();

                done();
            });
        });
    });


    lab.test('it returns paged results where end item is less than total', function (done) {

        Async.auto({
            setup: function (cb) {

                var testData = [{name: 'Ren'}, {name: 'Stimpy'}, {name: 'Yak'}];

                SubModel.insert(testData, cb);
            }
        }, function (err, results) {

            var query = {};
            var fields;
            var limit = 2;
            var page = 1;
            var sort = { _id: -1 };

            SubModel.pagedFind(query, fields, sort, limit, page, function (err, results) {

                Code.expect(err).to.not.exist();
                Code.expect(results).to.be.an.object();

                done();
            });
        });
    });


    lab.test('it returns paged results where begin item is less than total', function (done) {

        Async.auto({
            setup: function (cb) {

                var testData = [
                    {name: 'Ren'},
                    {name: 'Stimpy'},
                    {name: 'Yak'}
                ];

                SubModel.insert(testData, cb);
            }
        }, function (err, results) {

            var query = { 'role.special': { $exists: true } };
            var fields;
            var limit = 2;
            var page = 1;
            var sort = { _id: -1 };

            SubModel.pagedFind(query, fields, sort, limit, page, function (err, results) {

                Code.expect(err).to.not.exist();
                Code.expect(results).to.be.an.object();

                done();
            });
        });
    });
});


lab.experiment('BaseModel Proxied Methods', function () {

    var SubModel, liveTestData;


    lab.before(function (done) {

        SubModel = BaseModel.extend({
            constructor: function (attrs) {

                ObjectAssign(this, attrs);
            }
        });

        SubModel._collection = 'submodels';

        BaseModel.connect(function (err, db) {

            done(err);
        });
    });


    lab.after(function (done) {

        BaseModel.disconnect();

        done();
    });


    lab.test('it inserts data and returns the results', function (done) {

        var testData = [
            {name: 'Ren'},
            {name: 'Stimpy'},
            {name: 'Yak'}
        ];

        SubModel.insert(testData, function (err, results) {

            liveTestData = results;

            Code.expect(err).to.not.exist();
            Code.expect(results).to.be.an.array();

            done(err);
        });
    });


    lab.test('it updates a document and returns the results', function (done) {

        var query = {
            _id: liveTestData[0]._id
        };
        var update = {
            $set: { isCool: true }
        };

        SubModel.update(query, update, function (err, count, status) {

            Code.expect(err).to.not.exist();
            Code.expect(count).to.be.a.number();
            Code.expect(status).to.be.an.object();

            done(err);
        });
    });


    lab.test('it returns a collection count', function (done) {

        SubModel.count({}, function (err, result) {

            Code.expect(err).to.not.exist();
            Code.expect(result).to.be.a.number();

            done();
        });
    });


    lab.test('it returns a result array', function (done) {

        SubModel.find({}, function (err, result) {

            Code.expect(err).to.not.exist();
            Code.expect(result).to.be.an.array();

            done();
        });
    });


    lab.test('it returns a single result', function (done) {

        SubModel.findOne({}, function (err, result) {

            Code.expect(err).to.not.exist();
            Code.expect(result).to.be.an.object();

            done();
        });
    });


    lab.test('it returns a single result via id', function (done) {

        SubModel.findById(liveTestData[0]._id, function (err, result) {

            Code.expect(err).to.not.exist();
            Code.expect(result).to.be.an.object();

            done();
        });
    });


    lab.test('it updates a single document via id', function (done) {

        var document = { name: 'New Name' };

        SubModel.findByIdAndUpdate(liveTestData[0]._id, document, function (err, result) {

            Code.expect(err).to.not.exist();
            Code.expect(result).to.be.an.object();

            done();
        });
    });


    lab.test('it updates a single document via id (with options)', function (done) {

        var document = { name: 'New Name' };
        var options = { upsert: true };

        SubModel.findByIdAndUpdate(liveTestData[0]._id, document, options, function (err, result) {

            Code.expect(err).to.not.exist();
            Code.expect(result).to.be.an.object();

            done();
        });
    });


    lab.test('it removes a single document via id', function (done) {

        SubModel.findByIdAndRemove(liveTestData[0]._id, function (err, result) {

            Code.expect(err).to.not.exist();
            Code.expect(result).to.be.a.number();
            Code.expect(result).to.equal(1);

            done();
        });
    });


    lab.test('it removes documents via query', function (done) {

        SubModel.remove({}, function (err, result) {

            Code.expect(err).to.not.exist();
            Code.expect(result).to.be.a.number();
            Code.expect(result).to.equal(2);

            done();
        });
    });
});
