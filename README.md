NQP
=======================

NQP is a simple demonstration of how to take the Facebook Platform offline. Users browse to the site, login with Facebook and the system generates a QR code unique to the user. This code can then be scanned at a later date and used to allow serverside integration with the Facbook Platform without the user having to log in to a remote kiosk.

== Demo ==
 * http://telliott.net:18274/

== Instalation ==

 * Install node and npm (http://www.nodejs.org)
 * Clone the repo: git clone git@github.com:mrtom/nqp.git
 * cd nqp && npm install
 * Create the Database: node dbcreate.js
 * Run the server: node server.js
 * Navigate your browser to http://127.0.0.1:8000
 * TODO: How to use your own FB app
