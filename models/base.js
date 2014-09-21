var Joi = require('joi');
var Hoek = require('hoek');
var async = require('async');
var mongodb = require('mongodb');
var classExtend = require('ampersand-class-extend');
var config = require('../config');


var BaseModel = function () {
};


BaseModel.extend = classExtend;


BaseModel._idClass = mongodb.ObjectID;


BaseModel.ObjectId = BaseModel.ObjectID = mongodb.ObjectID;


BaseModel.connect = function (callback) {

    var url = config.get('/mongodb/url');
    var settings = config.get('/mongodb/settings');

    mongodb.MongoClient.connect(url, settings, function (err, db) {

        if (err) {
            return callback(err);
        }

        BaseModel.db = db;
        callback(null, db);
    });
};


BaseModel.disconnect = function () {

    BaseModel.db.close();
};


BaseModel.ensureIndexes = function (callback) {

    if (!config.get('/mongodb/autoIndex')) {
        return callback && callback();
    }

    if (!this.indexes) {
        return callback && callback();
    }

    var self = this;

    var tasks = this.indexes.map(function (index) {

        return function (done) {

            self.ensureIndex(index[0], index[1], done);
        };
    });

    async.parallel(tasks, callback);
};


BaseModel.ensureIndex = function (keys, options, callback) {

    var collection = BaseModel.db.collection(this._collection);
    collection.ensureIndex(keys, options, callback);
};


BaseModel.validate = function (input, cb) {

    return Joi.validate(input, this.schema, cb);
};


BaseModel.prototype.validate = function (cb) {

    return Joi.validate(this, this.constructor.schema, cb);
};


BaseModel.resultFactory = function () {

    var args = Array.prototype.slice.call(arguments);
    var next = args.shift();
    var err = args.shift();
    var result = args.shift();

    if (err) {
        args.unshift(result);
        args.unshift(err);
        return next.apply(undefined, args);
    }

    var self = this;

    if (Object.prototype.toString.call(result) === '[object Array]') {
        result.forEach(function (item, index) {

            result[index] = new self(item);
        });
    }

    if (Object.prototype.toString.call(result) === '[object Object]') {
        result = new this(result);
    }

    args.unshift(result);
    args.unshift(err);
    next.apply(undefined, args);
};


BaseModel.pagedFind = function (query, fields, sort, limit, page, callback) {

    var self = this;
    var output = {
        data: undefined,
        pages: {
            current: page,
            prev: 0,
            hasPrev: false,
            next: 0,
            hasNext: false,
            total: 0
        },
        items: {
            limit: limit,
            begin: ((page * limit) - limit) + 1,
            end: page * limit,
            total: 0
        }
    };

    fields = this.fieldsAdapter(fields);
    sort = this.sortAdapter(sort);

    async.auto({
        count: function (done) {

            self.count(query, done);
        },
        find: function (done) {

            var options = {
                limit: limit,
                skip: (page - 1) * limit,
                sort: sort
            };

            self.find(query, fields, options, done);
        }
    }, function (err, results) {

        if (err) {
            return callback(err);
        }

        output.data = results.find;
        output.items.total = results.count;

        // paging calculations
        output.pages.total = Math.ceil(output.items.total / limit);
        output.pages.next = output.pages.current + 1;
        output.pages.hasNext = output.pages.next <= output.pages.total;
        output.pages.prev = output.pages.current - 1;
        output.pages.hasPrev = output.pages.prev !== 0;
        if (output.items.begin > output.items.total) {
            output.items.begin = output.items.total;
        }
        if (output.items.end > output.items.total) {
            output.items.end = output.items.total;
        }

        callback(null, output);
    });
};


BaseModel.fieldsAdapter = function (fields) {

    if (Object.prototype.toString.call(fields) === '[object String]') {
        var document = {};

        fields = fields.split(/\s+/);
        fields.forEach(function (field) {

            if (field) {
                document[field] = true;
            }
        });

        fields = document;
    }

    return fields;
};


BaseModel.sortAdapter = function (sorts) {

    if (Object.prototype.toString.call(sorts) === '[object String]') {
        var document = {};

        sorts = sorts.split(/\s+/);
        sorts.forEach(function (sort) {

            if (sort) {
                var order = sort[0] === '-' ? -1 : 1;
                if (order === -1) {
                    sort = sort.slice(1);
                }
                document[sort] = order;
            }
        });

        sorts = document;
    }

    return sorts;
};


BaseModel.count = function () {

    var collection = BaseModel.db.collection(this._collection);
    var args = Array.prototype.slice.call(arguments);

    collection.count.apply(collection, args);
};


BaseModel.find = function () {

    var collection = BaseModel.db.collection(this._collection);
    var args = Array.prototype.slice.call(arguments);
    var callback = this.resultFactory.bind(this, args.pop());

    collection.find.apply(collection, args).toArray(callback);
};


BaseModel.findOne = function () {

    var collection = BaseModel.db.collection(this._collection);
    var args = Array.prototype.slice.call(arguments);
    var callback = this.resultFactory.bind(this, args.pop());

    args.push(callback);
    collection.findOne.apply(collection, args);
};


BaseModel.findById = function () {

    var collection = BaseModel.db.collection(this._collection);
    var args = Array.prototype.slice.call(arguments);
    var query = { _id: this._idClass(args.shift()) };
    var callback = this.resultFactory.bind(this, args.pop());

    args.unshift(query);
    args.push(callback);
    collection.findOne.apply(collection, args);
};


BaseModel.findByIdAndUpdate = function () {

    var collection = BaseModel.db.collection(this._collection);
    var args = Array.prototype.slice.call(arguments);
    var query = { _id: this._idClass(args.shift()) };
    var update = args.shift();
    var callback = this.resultFactory.bind(this, args.pop());
    var options = Hoek.applyToDefaults({ new: true }, args.pop() || {});

    collection.findAndModify(query, undefined, update, options, callback);
};


BaseModel.findByIdAndRemove = function (id, callback) {

    var collection = BaseModel.db.collection(this._collection);
    var query = { _id: this._idClass(id) };

    collection.remove(query, callback);
};


BaseModel.insert = function () {

    var collection = BaseModel.db.collection(this._collection);
    var args = Array.prototype.slice.call(arguments);
    var callback = this.resultFactory.bind(this, args.pop());

    args.push(callback);
    collection.insert.apply(collection, args);
};


BaseModel.update = function () {

    var collection = BaseModel.db.collection(this._collection);
    var args = Array.prototype.slice.call(arguments);

    collection.update.apply(collection, args);
};


BaseModel.remove = function () {

    var collection = BaseModel.db.collection(this._collection);
    var args = Array.prototype.slice.call(arguments);

    collection.remove.apply(collection, args);
};


module.exports = BaseModel;
