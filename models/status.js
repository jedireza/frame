var Joi = require('joi');
var extend = require('extend-object');
var BaseModel = require('./base');
var slug = require('slug');


var Status = BaseModel.extend({
    constructor: function (attrs) {

        extend(this, attrs);
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
        _id: slug(pivot + ' ' + name).toLowerCase(),
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
