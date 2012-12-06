NQP
=======================

NQP is two simple demonstrations of how to take the Facebook Platform offline, to allow intergation with Facebook on booths or other shared devices where it is undesirable for the user to login to the device directly.

## Demonstration 1
In the first deomonstration, a person can browse to the site (on their phone or tablet, ideally), login with Facebook and the system generates a QR code unique to them. This code can then be scanned on the booth at a later date and used to allow serverside integration with the Facbook Platform without the user having to log in to a remote kiosk.

### Live Demo
 * Load the 'booth' - http://telliott.net:18274/booth. Requires a modern browser with user media support and an attached webcbam. Tested on Chrome 22. Use that. Allow access to the camera. 
 * Load the user code - http://telliott.net:18274/. Use your smartphone ideally.
 * Scan your code from your smartphone with the webcam. The 'booth' should show a personalised view.

> ![User View](https://github.com/mrtom/nqp/raw/master/docs/images/UserView.png  "User view")  
> ![Allow Camera](https://github.com/mrtom/nqp/raw/master/docs/images/AllowCamera.png  "Allow Camera") ![Scan Code](https://github.com/mrtom/nqp/raw/master/docs/images/ScanCode.png "Scan Code") ![Personalised Experience](https://github.com/mrtom/nqp/raw/master/docs/images/BoothPersonalisesExperience.png "Personalised Experience")

## Demonstration 2

## Live Demo
 * Load the 'booth' - http://telliott.net:18274/dab. Requires a modern browser with user media support and an attached webcbam. Tested on Chrome 22. Use that. Allow access to the camera.
 # Red the on-screen intro. It'll describe what this is all about
 * Hit the 'Scan Card button' to fake a card scan
 * Follow the on-screen instructions to complete the Facebook Login for Devices Flow

## Want to run locally?
## Good! It's easy. Simply:

 * Install node and npm (http://www.nodejs.org)
 * Clone the repo: `git clone git@github.com:mrtom/nqp.git`
 * Install dependencies: `cd nqp && npm install`
 * Create the Database: `node dbcreate.js`
 * Create a config.js: `cp config.js.example config.js`
 * Update your Facebook App ID and App Secret (Head over to https://developers.facebook.com/apps if you don't have a Facebook App. Remember to add 'localhost' as a App Domain and either your Website or Mobile Web URL)
 * Run the server: node server.js
 * To use the second demo you will need to have your application whitelisted to use Facebook Login For Devices. Please refer to the [documentation](https://developers.facebook.com/docs/howtos/login/devices/ "Facebook Login for Devices documentation")
 * Follow the demo instructions above (but use your own domain:port rather than telliott:18274, obivously :)

 ## FAQ:
  * Where can I find out more detailed information about this project?
  ** Try README_DETAILED.md or the source

  * Can I use this project for my own purposes?
  ** Sure thing. It's licensed under the Apache 2 License. Please read it, especially where it says "software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied". Please bear in mind this project was built as a technology demonstration and not a production system.

  * Can I use this project in a commercial project?
  ** Absolutely.