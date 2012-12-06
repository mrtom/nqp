NQP
=======================

You probably want to read the 'README.md' file before reading this one. The README tells you what NQP is and how to use it. The purpose of this document is to help you understand how it works and how to hack on it.

NQP is a webapp built using [node](http://nodejs.org/ "node.js") on the serverside and [backbone](http://backbonejs.org/ "backbone.js") + [bootstrap](http://twitter.github.com/bootstrap "Twitter Bootstrap") on the clientside. 

Node servers all requests under /public as static files. The majority of the application is run as a javascript single-page app and is served in this way. The only exceptions of any note are the API methods (`/api/*)`, which are handled on a case by case base in `server.js`.

# Client
All client files are stored within `$NQP_ROOT/public`.

The client is structred as a default Backbone project, split into components under `/public/js` and using [require](http://requirejs.org/ "Require JS") for dependency resolution. Generally speaking, each component has several modules -  view, model and template - and the code for each component is split into the various directories.

-- public/
  -- js/              - The Javascript
    -- collections/   - Backbone collections
    -- models/        - Backbone models
    -- plugins/       - jquery plugins
    -- routers/       - The main Router for the application. Loads modules based on the URL
    -- template/      - Contains the HTML teamplates for each component
    -- vendor/        - Javascript libraries.
    -- views/         - Backbone views for each component
    -- init.js        - Initialisation for require.js
  -- channel.html   - Used by the Facebook JS SDK

##Important components - for Booths:
 * booth         - The main view shown on the booth in the first demonstration
 * dab           - Device Auth Booth. The main view shown on the booth in the second demonstration
 * boothPagelets - Common modules for functionality once the user is logged in 

## Important components - for the User Client (i.e. the mobile app for the first demonstration)
 * main    - The main view shown on a users phone // FIXME: Rename this to somethign more sensible
 * nav     - The nav bar
 * chrome  - A simple container for the main and nav components

## Vendor:
Important files & directories include:
-- vendor/
 -- qr_reader    - The QR reader
 -- fb.js        - Initialises the Facebook JS SDK
 -- qrcode.js    - QR Code generator

The rest of this directory is taken up with stock builds of the various required libraries

# Server
The bulk of the server is contained within `$NQP_ROOT/server.js`, and data is persisted in an SQLite Database. The server only really handles requests for the API (requests for the user interface as served statically and handled in Backbone).

# User Flow - First demonstration
The first demonstration consists of three parts - the User Client, Booth Client and Server.

The User Client allows the user to login with Facebook and register with the app, then generate a QR code. This is accessed at the root directory. This loads the chrome view, containing the nav view and the main view. The QR code contains a hash of their Facebook unique ID, which is stored in the database alongise their access token. The hash is generated on the server by calling the `/api/gen` endpoint with the users Facebook signed request.

The booth is running on a seperate machine by loading `/booth`. The user is not (and will never be) logged into this machine. When the user approaches the booth they are prompted to scan their QR code. When the booth detects a successful scan it reads the hash encoded in the QR code and passes this to the `/api/get_access_token` endpoint. This endpoint returns the access token to the Booth client, which it then uses to perform reads against the Facebook Graph API using the Facebook JS SDK. The results of these reads are then displayed to the user.

# User Flow - Second demonstration
The second demonstration consists of only two parts - the Booth Client and Server.

The user arrives at the Booth and enters an external (or pre-existing) unique ID (for the purposes of this demo this number is generated automatically). The client calls the server endpoint `/api/get_access_token_or_device_auth_code`. The server checks the database to see if the external ID is already present. If so, it retrieves the associated access token and checks if it is still valid by making an API request to Facebook. If the token is still valid, this is simply returned to the client.

If there is no record of the external ID, or if the access token is invalid, the server requests a new login via Facebook [Login for Devices](https://developers.facebook.com/docs/howtos/login/devices/ "Login for Devices Documentation"). The server API acts as a simple proxy to the client, and passes back the results of the request.

The client then follows the Login for Devices protocol, polling Facebook (via the server's `/api/check_device_auth_status` endpoint). When the user has authorized access to the application, the server will be returned an access token from Facebook, which it passes back to the client. The client then uses this to perform reads against the Facebook Graph API using the Facebook JS SDK. The results of these reads are then displayed to the user.