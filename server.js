var composer = require('./index');


composer(function (err, server) {

    if (err) {
        throw err;
    }

    server.start(function () {

        console.log('Started the plot device.');
    });
});
