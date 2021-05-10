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
        type: String
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
                type: String
            }
        }
    ]
})

module.exports = Conv;