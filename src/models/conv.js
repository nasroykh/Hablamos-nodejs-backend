const mongoose = require('mongoose');
const validator = require('validator');

const Conv = mongoose.model('conv', {
    participants: [
        {
            type: String,
            required: true
        }
    ],
    groupName: {
        type: String,
        unique: true
    },
    createdAt: {
        type: Number
    },
    messages: [
        {
            sender: {
                type: String
            },
            message: {
                type: String
            },
            sentAt: {
                type: Number
            },
            file: {
                type: Buffer
            }
        }
    ]
})

module.exports = Conv;