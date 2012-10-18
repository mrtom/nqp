var sqlite3 = require('sqlite3').verbose();

var db = new sqlite3.Database('./db/master.sqlite');

db.serialize(function() {
  db.run("DROP TABLE IF EXISTS user");
  db.run("CREATE TABLE user (uid VARCHAR, fuid VARCHAR, access_token VARCHAR, code VARCHAR)");
});

db.close();
