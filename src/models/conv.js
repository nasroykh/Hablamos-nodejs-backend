const mongoose = require('mongoose');
const validator = require('validator');

const Conv = mongoose.model('conv', {
    participants: [
        {
            type: String,
            required: true
        }
    ],
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
            }
        }
    ]
})

module.exports = Conv;