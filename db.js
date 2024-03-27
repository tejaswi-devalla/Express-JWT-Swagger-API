const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./users.db");

db.get(
  "SELECT name FROM sqlite_master WHERE type='table' AND name='Users'",
  (err, row) => {
    if (err) {
      console.error("Error checking for Users table:", err.message);
    } else if (row) {
      console.log("Users table already exists");
    } else {
      db.run(
        "CREATE TABLE Users (id INTEGER PRIMARY KEY,name TEXT, email TEXT,username TEXT,  password TEXT)",
        function (err) {
          if (err) {
            console.error("Error creating Users table:", err.message);
          } else {
            console.log("Users table created");
          }
        }
      );
    }
  }
);

module.exports = db;
