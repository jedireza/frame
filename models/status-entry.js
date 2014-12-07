var Joi = require('joi');
var Extend = require('extend-object');
var BaseModel = require('./base');


var StatusEntry = BaseModel.extend({
    constructor: function (attrs) {

        Extend(this, attrs);
    }
});


StatusEntry.schema = Joi.object().keys({
    id: Joi.string().required(),
    name: Joi.string().required(),
    timeCreated: Joi.date().required(),
    userCreated: Joi.object().keys({
        id: Joi.string().required(),
        name: Joi.string().required()
    }).required()
});


module.exports = StatusEntry;
