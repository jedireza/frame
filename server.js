var composer = require('./index');


composer(function (err, pack) {

    if (err) {
        throw err;
    }

    pack.start(function () {

        console.log('Started the plot device.');
    });
});
