const mongoose = require('mongoose');
const validator = require('validator');



const User = mongoose.model('user', {
    username: {
        type: String,
        // required: true
    },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    email: {
        type: String,
        // required: true
    },
    password: {
        type: String,
        // required: true
    },
    profilePicture: {
        type: Buffer
    },
    friends: [
        {
            type: String
        }
    ],
    friendRequests: [
        {
            senderUsername: String
        }
    ],
    status: {
        type: String
    }
});

module.exports = User;