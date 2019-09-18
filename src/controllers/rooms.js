const { collectionAction } = require('./mongohelpers');
const { mongoCollections, mongoHistoryLimit } = require('../config');

exports.getRooms = async () => {
    return collectionAction(mongoCollections.rooms, async col => {
        return await col.find({}).toArray();
    });
}

exports.getRoomByName = async (name) => {
    return collectionAction(mongoCollections.rooms, async col => {
        return await col.findOne({ name });
    });
}

exports.addRoom = async (name) => {
    return collectionAction(mongoCollections.rooms, async col => {
        return await col.insertOne({ name });
    });
}

exports.addMessage = async (msg) => {
    const { room, author, message } = msg;
    const roomObject = await exports.getRoomByName(room);
    return collectionAction(mongoCollections.messages, async col => {
        return await col.insertOne({ message, author, room: roomObject._id, createdAt: new Date() });
    });
}

exports.getRoomMessages = async (roomId) => {
    return collectionAction(mongoCollections.messages, async col => {
        return await col.find({ room: roomId }).sort([['createdAt', -1]]).limit(mongoHistoryLimit).toArray();
    });
}

