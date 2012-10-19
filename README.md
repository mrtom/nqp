NQP
=======================

NQP is a simple demonstration of how to take the Facebook Platform offline. Users browse to the site, login with Facebook and the system generates a QR code unique to the user. This code can then be scanned at a later date and used to allow serverside integration with the Facbook Platform without the user having to log in to a remote kiosk.

## Demo
 * http://telliott.net:18274/

## Instalation

 * Install node and npm (http://www.nodejs.org)
 * Clone the repo: `git clone git@github.com:mrtom/nqp.giti`
 * Install dependencies: `cd nqp && npm installi`
 * Create the Database: `node dbcreate.jsi`
 * Create a config.js: `cp config.js.example config.js`
 * Update your Facebook App ID and App Secret (Head over to https://developers.facebook.com/apps if you don't have a Facebook App. Remember to add 'localhost' as a App Domain and either your Website or Mobile Web URL)
 * Replace other instances of the App ID in the code: `grep -R 426695997394974 *` // TODO: Make this less shit
 * Run the server: node server.js
 * Navigate your browser to http://127.0.0.1:8000
