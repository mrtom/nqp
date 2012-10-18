var sqlite3 = require('sqlite3').verbose();

var db = new sqlite3.Database('./db/master.sqlite');

db.serialize(function() {
  db.run("DROP TABLE IF EXISTS user");
  db.run("CREATE TABLE user (uid INTEGER PRIMARY KEY AUTOINCREMENT, fbid VARCHAR KEY, access_token BLOB, access_token_expires VARCHAR, hash BLOB KEY)");
});

db.close();
