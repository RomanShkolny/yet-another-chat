exports.mongourl = 'mongodb://localhost:27017';

exports.mongoDB = 'YetAnotherChat';

exports.mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

exports.mongoCollections = {
  rooms: 'rooms',
  messages: 'messages',
  users: 'users'
};

exports.mongoHistoryLimit = 10;
exports.ttsURL = 'https://stream-fra.watsonplatform.net/text-to-speech/api/v1/synthesize';
exports.ttsAPIKEY = 'j5xWmQqKMqM0AkTVAQYgN_hFnBUO_25j3PISuNXp0pp2';

exports.facebookClientID = '3655057521187144';
exports.facebookClientSecret = '180fe487233055e9fc1e9609f2317ff0';

exports.facebookCallbackURL = 'http://localhost:3000/auth/facebook/callback';