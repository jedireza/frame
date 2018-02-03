'use strict';
const Glue = require('glue');
const Manifest = require('./manifest');


process.on('unhandledRejection', (reason, promise) => {

    console.error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
});


const main = async function () {

    const options = { relativeTo: __dirname };
    const server = await Glue.compose(Manifest.get('/'), options);

    await server.start();

    console.log(`Server started on port ${Manifest.get('/server/port')}`);
};


main();
