var Joi = require('joi');
var Extend = require('extend-object');
var BaseModel = require('./base');


var NoteEntry = BaseModel.extend({
    constructor: function (attrs) {

        Extend(this, attrs);
    }
});


NoteEntry.schema = Joi.object().keys({
    data: Joi.string().required(),
    timeCreated: Joi.date().required(),
    userCreated: Joi.object().keys({
        id: Joi.string().required(),
        name: Joi.string().required()
    }).required()
});


module.exports = NoteEntry;
