var User = require('../../models/user');
var Admin = require('../../models/admin');


var user = new User({
    _id: '535HOW35',
    username: 'ren',
    roles: {
        admin: {
            id: '953P150D35',
            name: 'Ren Höek'
        }
    },
    _roles: {
        admin: new Admin({
            _id: '953P150D35',
            name: {
                full: 'Ren Höek',
                first: 'Ren',
                last: 'Höek'
            },
            groups: {
                root: 'Root'
            }
        })
    }
});


module.exports = user;
