# Frame

An API boilerplate for Node.js. Bring your own front-end.


## Technology

__Primary goal:__ include as few dependencies as possible

Frame is built with the [hapi.js framework](https://github.com/hapijs/hapi) and
[toolset](https://github.com/hapijs). We're using
[MongoDB](https://github.com/mongodb/node-mongodb-native/) as a data store. We
also user [Nodemailer](https://github.com/andris9/Nodemailer) for email
transport.

Please [refer to the wiki](https://github.com/jedireza/frame/wiki/) for
more details.


## Live demos

| endpoint                              | username | password |
|:------------------------------------- |:-------- |:-------- |
| https://hapiframe.herokuapp.com/docs/ | coming   | soon     |
| https://hapiframe.nodejitsu.com/docs/ | coming   | soon     |

[Postman](http://www.getpostman.com/) is a great tool for testing and
developing APIs.

__Note:__ The live demos have been modified so you cannot change the root user, the root user's linked admin role or the root admin group. This was done in order to keep the API ready to show at all times.


## Requirements

You need [Node.js](http://nodejs.org/download/) and
[MongoDB](http://www.mongodb.org/downloads) installed and running.

We use [`bcrypt`](https://github.com/ncb000gt/node.bcrypt.js) for hashing
secrets. If you have issues during installation related to `bcrypt` then [refer
to this wiki
page](https://github.com/jedireza/frame/wiki/bcrypt-Installation-Trouble).


## Installation

```bash
$ git clone git@github.com:jedireza/frame.git && cd ./frame
$ npm install
```


## Setup

__WARNING:__ This will clear all data in existing `users`, `admins` and
`admingroups` MongoDB collections. It will also overwrite an existing
`/config.js` file.

```bash
$ npm run setup

# > frame@0.0.0 setup /Users/jedireza/projects/frame
# > ./setup.js

# Project name: (Frame)
# MongoDB URL: (mongodb://localhost:27017/frame)
# Root user email: jedireza@gmail.com
# Root user password:
# System email: (jedireza@gmail.com)
# SMTP host: (smtp.gmail.com)
# SMTP port: (465)
# SMTP username: (jedireza@gmail.com)
# SMTP password:
# Setup complete.
```


## Running the app

```bash
$ npm start

# > frame@0.0.0 start /Users/jedireza/projects/frame
# > ./node_modules/nodemon/bin/nodemon.js -e js,md server

# 20 Sep 03:47:15 - [nodemon] v1.2.1
# 20 Sep 03:47:15 - [nodemon] to restart at any time, enter `rs`
# 20 Sep 03:47:15 - [nodemon] watching: *.*
# 20 Sep 03:47:15 - [nodemon] starting `node server index.js`
# Started the plot device.
```

This will start the app using [`nodemon`](https://github.com/remy/nodemon).
`nodemon` will watch for changes and restart the app as needed.


## Philosophy

 - Create a user system API
 - Don't include a front-end
 - Write code in a simple and consistent way
 - It's just JavaScript
 - 100% test coverage


## Features

 - Login system with forgot password and reset password
 - Abusive login attempt detection
 - User roles for accounts and admins
 - Facilities for notes and status updates
 - Admin groups with shared permissions
 - Admin level permissions that override group permissions


## Questions and contributing

Any issues or questions (no matter how basic), open an issue. Please take the
initiative to include basic debugging information like operating system
and relevant version details such as:

```bash
$ npm version

# { http_parser: '1.0',
#   node: '0.10.29',
#   v8: '3.14.5.9',
#   ares: '1.9.0-DEV',
#   uv: '0.10.27',
#   zlib: '1.2.3',
#   modules: '11',
#   openssl: '1.0.1h',
#   npm: '1.4.20',
#   frame: '0.0.0' }
```

```bash
$ mongo --version

# MongoDB shell version: 2.2.1
```

```bash
$ mongod --version

# db version v2.2.1, pdfile version 4.5
```

Contributions welcome. Your code should:

 - include 100% test coverage
 - follow the [hapi.js coding conventions](https://github.com/hapijs/hapi/blob/master/docs/Style.md)

If you're changing something non-trivial, you may want to submit an issue
first.


## Running tests

[Lab](https://github.com/hapijs/lab) is part of the hapi.js toolset and what we
use to write all of our tests.

For command line output:

```bash
$ npm test

# > frame@0.0.0 test /Users/jedireza/projects/frame
# > ./node_modules/lab/bin/lab -c

# ..................................................
# ..................................................
# ..................................................
# ..................................................
# ..................................................
# .............................

# 279 tests complete
# Test duration: 4628 ms
# No global variable leaks detected
# Coverage: 100.00%
```

With html code coverage report:

```bash
$ npm run test-cover

# > frame@0.0.0 test-cover /Users/jedireza/projects/frame
# > ./node_modules/lab/bin/lab -c -r html -o ./test/artifacts/coverage.html && open ./test/artifacts/coverage.html
```

This will run the tests and open a web browser to the visual code coverage
artifcacts. The generated source can be found in `/tests/artifacts/coverage.html`.


## License

MIT

## Don't forget

What you build with Frame is more important than Frame.
