var Lab = require('lab');
var Code = require('code');
var lab = exports.lab = Lab.script();
var Status = require('../../models/status');


lab.experiment('Status Class Methods', function () {

    lab.before(function (done) {

        Status.connect(function (err, db) {

            done(err);
        });
    });


    lab.after(function (done) {

        Status.remove({}, function (err, result) {

            Status.disconnect();

            done(err);
        });
    });


    lab.test('it returns a new instance when create succeeds', function (done) {

        Status.create('Order', 'Complete', function (err, result) {

            Code.expect(err).to.not.exist();
            Code.expect(result).to.be.an.instanceOf(Status);

            done();
        });
    });


    lab.test('it returns an error when create fails', function (done) {

        var realInsert = Status.insert;
        Status.insert = function () {

            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();

            callback(Error('insert failed'));
        };

        Status.create('Order', 'Fulfilled', function (err, result) {

            Code.expect(err).to.be.an.object();
            Code.expect(result).to.not.exist();

            Status.insert = realInsert;

            done();
        });
    });
});
