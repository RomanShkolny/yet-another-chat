const MongoClient = require('mongodb').MongoClient;

const { mongourl, mongoDB, mongoOptions } = require('../config');

exports.collectionAction = async function(colname, operation) {
  const client = await MongoClient.connect(mongourl, mongoOptions);
  try {
    const res = await operation(client.db(mongoDB).collection(colname));
    return res;
  }
  finally {
    client.close();
  }
}
