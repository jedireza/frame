var Joi = require('joi');
var Extend = require('extend-object');
var BaseModel = require('./base');
var Slug = require('slug');


var Status = BaseModel.extend({
    constructor: function (attrs) {

        Extend(this, attrs);
    }
});


Status._collection = 'statuses';


Status._idClass = String;


Status.schema = Joi.object().keys({
    _id: Joi.string(),
    pivot: Joi.string().required(),
    name: Joi.string().required()
});


Status.indexes = [
    [{ pivot: 1 }],
    [{ name: 1 }]
];


Status.create = function (pivot, name, callback) {

    var document = {
        _id: Slug(pivot + ' ' + name).toLowerCase(),
        pivot: pivot,
        name: name
    };

    this.insert(document, function (err, statuses) {

        if (err) {
            return callback(err);
        }

        callback(null, statuses[0]);
    });
};


module.exports = Status;
