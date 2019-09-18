const ObjectID = require('mongodb').ObjectID;

const { collectionAction } = require('./mongohelpers');
const { mongoCollections } = require('../config');


exports.getUserByObjectId = async (objectId) => {
    return collectionAction(mongoCollections.users, async col => {
        return await col.findOne({ _id: new ObjectID(objectId) });
    });
}

exports.findOrInsertFacebookUser = async (credentials) => {
    return collectionAction(mongoCollections.users, async col => {
        let user = await col.findOne({ id: credentials.id });
        if (!user) {
            const result = await col.insertOne({ ...credentials, username: credentials.displayName, createdAt: new Date() });
            user = { ...credentials, _id: result.insertedId };
        }
        return user;
    });
}


exports.findLocalUser = async (username) => {
    return collectionAction(mongoCollections.users, async col => {
        return await col.findOne({ username, provider: 'local' });
    });
}

exports.registerLocalUser = async (username, hash) => {
    return collectionAction(mongoCollections.users, async col => {
        const result = await col.insertOne({ username, hash, provider: 'local', createdAt: new Date() });
        return { username, hash, _id: result.insertedId };
    });
}