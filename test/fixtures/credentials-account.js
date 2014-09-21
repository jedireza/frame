var User = require('../../models/user');
var Account = require('../../models/account');


var user = new User({
    username: 'stimpy',
    roles: {
        account: {
            id: '5250W35',
            name: 'Stimpson J Cat'
        }
    },
    _roles: {
        account: new Account({
            _id: '5250W35',
            name: {
                first: 'Stimpson',
                middle: 'J',
                last: 'Cat'
            }
        })
    }
});


module.exports = user;
