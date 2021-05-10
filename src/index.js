/* optional modules to install: bad-words, moment */
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const socketio = require('socket.io');
const http = require('http');

require('./db/mongoose');

const User = require('./models/user');
const Conv = require('./models/conv');

const app = express();
app.use(cors());

const port = process.env.PORT || 4444;
const server = http.createServer(app);

const io = socketio(server, {
    cors: {
        origin: '*',
    }
});

app.use(express.json());

io.on('connection', (socket) => {
    console.log('New WebSocket connection');

    socket.on('openConv', async ({username, friend, conv}) => {
        try {
            console.log(username, friend, conv)
            if (conv && !friend) {
                await Conv.findById(conv, (err, data) => {
                    if (data) {
                        socket.join(conv);
                        socket.emit('conv', data);
                    } else {
                        socket.emit('conv', 'Conv doesn\'t exist!')
                    }
                });
            } else {
                await Conv.find({participants: {$all: [username, friend]}}, (err, data) => {
                    if (data.length) {
                        socket.emit('conv', data[0]);
                        socket.join(mongoose.Types.ObjectId(data[0]._id).toHexString());
                    } else {
                        socket.emit('conv', 'Conv doesn\'t exist!')
                    }
                });
            }
        } catch (e) {
            console.log(e);
        }
    }) 

    socket.on('sendMessage', async ({username, message, conv, friend}) => {
        const date = Date.now();
        if (conv) {
            console.log(conv);
            await Conv.findByIdAndUpdate(conv, {$push: {messages: {
                message,
                sender: username,
                sentAt: date
            }}});
            io.to(conv).emit('receiveMessage', {username, message, date, _id: mongoose.Types.ObjectId()});
        } else {
            const newConv = new Conv({
                participants: [username,friend],
                createdAt: date,
                messages: [{
                    sender: username,
                    message,
                    sentAt: date
                }]
            });
            const savedConv = await newConv.save();
            await socket.join(mongoose.Types.ObjectId(savedConv._id).toHexString());
            await io.to(mongoose.Types.ObjectId(savedConv._id).toHexString()).emit('receiveMessage', {username, message, date, _id: mongoose.Types.ObjectId()});
        }
        

        
    });

    socket.emit('message', 'Hello there!');
    socket.on('messageBack', (mes, callback) => {
        console.log(mes)
        callback('Delivered!');
    });

    socket.on('disconnect', () => {
        console.log('A client has left!')
    })
});



app.get('/users', async (req,res) => {
    try {
        // const newUser = new User({
        //     username: 'hafid',
        //     friends: [
        //         'hamid'
        //     ]
        // });
        // const newUser2 = new User({
        //     username: 'hamid',
        //     friends: [
        //         'hafid'
        //     ]
        // });
        // await newUser.save();
        // await newUser2.save();
        const users = await User.find({});
        res.status(200).send(users)
    } catch (e) {
        res.status(404).send(e);
    }
});

app.post('/conv', async (req,res) => {
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

app.post('/request', (req,res) => {

});

server.listen(port, () => {
    console.log(`Server listens to port ${port}`);
})