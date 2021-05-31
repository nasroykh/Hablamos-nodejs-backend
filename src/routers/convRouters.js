const express = require('express');
const router = new express.Router();
const Conv = require('../models/conv');
const auth = require('../middleware/auth');
const User = require('../models/user');

router.get('/convs', auth, async (req, res) => {
    try {

        let {_id, friendId} = req.query;

        //Find one conv by id
        if (_id) {
            let conv = await Conv.findById(_id);

            if (!conv) {
                return res.status(404).send('No conversation');
            }

            return res.status(200).send(conv);
        }

        //Find one conv by second participant id
        if (friendId) {
            let conv = await Conv.findOne({participants: {$all: [req.user._id, friendId]}});
            
            if (!conv) {
                return res.status(404).send('No conversation');
            }

            return res.status(200).send(conv);
        }

        //find all user convs
        let convs = await Conv.find({participants: {$all: [req.user._id] }});

        if (!convs) {
            return res.status(404).send('No conversations')
        }

        res.status(200).send(convs);
    } catch (e) {
        return res.status(500).send(e);
    }
});

router.post('/convs/message', auth, async (req, res) => {
    try {
        let {message, friendId, _id} = req.body;
        let time = Date.now();

        if (!_id) {
            let conv = new Conv({
                participants: [req.user._id, friendId],
                createdAt: time,
                messages: [
                    {
                        sender: req.user._id,
                        message,
                        sentAt: time
                    }
                ]
            });
    
            await conv.save();
            
            res.status(201).send('Conversation created and message sent');
        }

        await Conv.findByIdAndUpdate(_id, {$push: {
            messages: {
                sender: req.user._id,
                message,
                sentAt: time
            }
        }});

        let user = await User.findById(friendId);

        req.io.to(user.socketId).emit('notify:message', req.user._id);
        req.io.to(_id).emit('message:receive', {message, sender: req.user._id, time})
        res.status(201).send('Message sent');

    } catch (e) {
        res.status(500).send(e);
    }
});

// router.post('/convs', async (req,res) => {
//     try {
//         await User.find({username: req.body.part[0]}, (e, el) => {
//             console.log(el);
//         })
//         await User.find({username: req.body.part[1]}, (e, el) => {
//             console.log(el);
//         })
//         const user1 = req.body.part[0];
//         const user2 = req.body.part[1];
//         const date = Date.now();
//         const message = {
//             id: mongoose.Types.ObjectId(),
//             senderId: user1,
//             message: req.body.message,
//             sentAt: date
//         };

//         const found = await Conv.findById('6097c15e12d73a2b922a05c8')
//         console.log(found);

//         await Conv.findByIdAndUpdate('6097cb029c24c53cd0483000',{$push: {messages: {
//             messageId: message.id,
//             senderId: user2,
//             message: message.message,
//             sentAt: date
//         }}})

//         const newConv = new Conv({
//             participants: [user1,user2],
//             createdAt: date,
//             messages: [{
//                 messageId: message.id,
//                 senderId: user1,
//                 message: message.message,
//                 sentAt: date
//             }]
//         })

//         await newConv.save();

//         const convs = await Conv.find({});
//         res.send(convs);
//     } catch (e) {
//         console.log(e);
//     }

// });

module.exports = router;