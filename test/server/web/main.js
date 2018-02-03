'use strict';
const Code = require('code');
const Hapi = require('hapi');
const Lab = require('lab');
const Main = require('../../../server/web/main');
const Manifest = require('../../../manifest');


const lab = exports.lab = Lab.script();
let server;


lab.before(async () => {

    server = Hapi.Server();

    const plugins = Manifest.get('/register/plugins')
        .filter((entry) => Main.dependencies.includes(entry.plugin))
        .map((entry) => {

            entry.plugin = require(entry.plugin);

            return entry;
        });

    plugins.push(Main);

    await server.register(plugins);
    await server.start();
});


lab.after(async () => {

    await server.stop();
});


lab.experiment('GET /', () => {

    let request;


    lab.beforeEach(() => {

        request = {
            method: 'GET',
            url: '/'
        };
    });


    lab.test('it returns HTTP 200 when all is good', async () => {

        const response = await server.inject(request);

        Code.expect(response.statusCode).to.equal(200);
        Code.expect(response.result).to.match(/welcome/i);
    });
});
