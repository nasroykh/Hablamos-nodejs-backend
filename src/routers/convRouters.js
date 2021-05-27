const express = require('express');
const router = new express.Router();
const Conv = require('../models/conv');

router.post('/conv', async (req,res) => {
    try {
        // await User.find({username: req.body.part[0]}, (e, el) => {
        //     console.log(el);
        // })
        // await User.find({username: req.body.part[1]}, (e, el) => {
        //     console.log(el);
        // })
        const user1 = req.body.part[0];
        const user2 = req.body.part[1];
        const date = Date.now();
        const message = {
            id: mongoose.Types.ObjectId(),
            senderId: user1,
            message: req.body.message,
            sentAt: date
        };

        // const found = await Conv.findById('6097c15e12d73a2b922a05c8')
        // console.log(found);

        await Conv.findByIdAndUpdate('6097cb029c24c53cd0483000',{$push: {messages: {
            messageId: message.id,
            senderId: user2,
            message: message.message,
            sentAt: date
        }}})

        // const newConv = new Conv({
        //     participants: [user1,user2],
        //     createdAt: date,
        //     messages: [{
        //         messageId: message.id,
        //         senderId: user1,
        //         message: message.message,
        //         sentAt: date
        //     }]
        // })

        // await newConv.save();

        const convs = await Conv.find({});
        res.send(convs);
    } catch (e) {
        console.log(e);
    }

});

module.exports = router;