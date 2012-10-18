var config = {}

var apps = {
  'prod': {
    app_id: '',
    secret: ''
  },
  'dev': {
    app_id: '426695997394974',
    secret: 'f666d6716dd9ef06bb37092b36ebd06b'
  }
}

config.app = apps['dev'];
config.FACEBOOK_HOST = 'graph.facebook.com';
config.DEV_MODE = true;
config.ON_A_PLANE = true;

module.exports = config;
