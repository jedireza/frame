var Lab = require('lab');
var lab = exports.lab = Lab.script();
var AdminGroup = require('../../models/admin-group');


lab.experiment('AdminGroup Class Methods', function () {

    lab.before(function (done) {

        AdminGroup.connect(function (err, db) {

            done(err);
        });
    });


    lab.after(function (done) {

        AdminGroup.remove({}, function (err, result) {

            AdminGroup.disconnect();

            done(err);
        });
    });


    lab.test('it returns a new instance when create succeeds', function (done) {

        AdminGroup.create('Sales', function (err, result) {

            Lab.expect(err).to.not.be.ok;
            Lab.expect(result).to.be.an.instanceOf(AdminGroup);

            done();
        });
    });


    lab.test('it returns an error when create fails', function (done) {

        var realInsert = AdminGroup.insert;
        AdminGroup.insert = function () {

            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();

            callback(Error('insert failed'));
        };

        AdminGroup.create('Support', function (err, result) {

            Lab.expect(err).to.be.an('object');
            Lab.expect(result).to.not.be.ok;

            AdminGroup.insert = realInsert;

            done();
        });
    });
});


lab.experiment('AdminGroup Instance Methods', function () {

    lab.before(function (done) {

        AdminGroup.connect(function (err, db) {

            done(err);
        });
    });


    lab.after(function (done) {

        AdminGroup.remove({}, function (err, result) {

            AdminGroup.disconnect();

            done(err);
        });
    });


    lab.test('it returns false when permissions are not found', function (done) {

        AdminGroup.create('Sales', function (err, adminGroup) {

            Lab.expect(err).to.not.be.ok;
            Lab.expect(adminGroup).to.be.an.instanceOf(AdminGroup);
            Lab.expect(adminGroup.hasPermissionTo('SPACE_MADNESS')).to.equal(false);

            done();
        });
    });


    lab.test('it returns boolean values for set permissions', function (done) {

        AdminGroup.create('Support', function (err, adminGroup) {

            Lab.expect(err).to.not.be.ok;
            Lab.expect(adminGroup).to.be.an.instanceOf(AdminGroup);

            adminGroup.permissions = {
                SPACE_MADNESS: true,
                UNTAMED_WORLD: false
            };

            Lab.expect(adminGroup.hasPermissionTo('SPACE_MADNESS')).to.equal(true);
            Lab.expect(adminGroup.hasPermissionTo('UNTAMED_WORLD')).to.equal(false);

            done();
        });
    });
});
