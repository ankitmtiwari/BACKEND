const mongoose = require("mongoose");

async function makeMongoDbConnection(db_url) {
  return mongoose.connect("mongodb://127.0.0.1:27017/apna_hisab");
}

module.exports = { makeMongoDbConnection };
