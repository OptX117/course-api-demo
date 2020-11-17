# Lecture Demo App
Basic REST API to demonstrate a course booking service.

Uses node.js and ExpressJS, provides a REST api documented by OpenAPI.

The OpenAPI definition are also used to check incoming requests for validity and are rebuild from JSDoc comments every time the app is build.
This is done via extracting the schemas in the OpenAPI definition JSON and checking the requests against them using [jsonschema](https://www.npmjs.com/package/jsonschema).

When running, a Swagger UI instance can be reached at `/api-docs`.

For the considerations behind the implementation, see [API Design](/doc/API%20Design.md).
For next steps, specifically in regards to security, see [Next Steps](/doc/Next%20Steps.md)

## Setup
Docker has to be installed on the system.

* nodejs >= v12 installed
* npm i 
* gulp fill-db

If wanting to run e2e tests, refer to the setup portion of the [frontend README](/web/README.md).

## Development
The application is build via webpack and will be located in the `bin` folder.

### Watchmode
To launch into watch mode, run

`gulp watch`

this will launch the database, and rebuild the backend including the OpenAPI specs every time a change is detected.

### Start
#### Backend and frontend
To launch both frontend and backend in dev mode, run

`gulp start-both`

#### Only backend
To launch the app from already build files and without launching a DB container, run

`gulp start`

this expects a MongoDB container to be reachable at port 27017. 

To fill this DB with example data, run

`gulp fill-db`

To explicitly start it, run 

`gulp start-db`

#### Only frontend
To only serve the frontend, run

`gulp serve-frontend`

This will expect the backend to already run at Port 3000

### Building
To build the app without launching it, run

`gulp build`

This will build the back- and frontend.

If you execute `gulp start` afterwards the full app should be available at port 3000, including frontend

### Generate JSON Schemas from existing OpenAPI definitions
To update or generate JSON schemas in the bin  

## Tests
### Unit & functional tests
To run tests run

`gulp test`

A database will automatically be launched, be aware that this also clears out any data inserted via `gulp fill-db`.

### E2E Tests
To run e2e tests, please first refer to the setup portion of the frontend README.

To run e2e tests against, run

`gulp test-e2e`

This will launch the backend, a database and the frontend, as well as execute cypress.io tests.


##Configuration
A configuration json is present in src/config/config.json that is copied into bin/config/config.json on build.

The following configuration items are available:

* `port`: Port to start at
* `mongodb`: Mongodb Config
    * `host`: Hostname to connect to
    * `port`: Optional port to connect to
    * `auth`: Username & PW to log in with
        * `username`
        * `password`
* `jwt`: Secret used to sign the JWT tokens

In reality these would probably all be environment variables or set via a configuration server.
