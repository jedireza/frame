var Joi = require('joi');
var extend = require('extend-object');
var BaseModel = require('./base');
var slug = require('slug');


var AdminGroup = BaseModel.extend({
    constructor: function (attrs) {

        extend(this, attrs);
    },


    hasPermissionTo: function (permission) {

        if (this.permissions && this.permissions.hasOwnProperty(permission)) {
            return this.permissions[permission];
        }

        return false;
    }
});


AdminGroup._collection = 'adminGroups';


AdminGroup._idClass = String;


AdminGroup.schema = Joi.object().keys({
    _id: Joi.string(),
    name: Joi.string().required(),
    permissions: Joi.object().description('{ permission: boolean, ... }')
});


AdminGroup.create = function (name, callback) {

    var document = {
        _id: slug(name).toLowerCase(),
        name: name
    };

    this.insert(document, function (err, groups) {

        if (err) {
            return callback(err);
        }

        callback(null, groups[0]);
    });
};


module.exports = AdminGroup;
