/* optional modules to install: bad-words, moment */
/* IMPORTING MODULES */
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const socketio = require('socket.io');
const http = require('http');

/* IMPORTING LOCAL FILES */
require('./db/mongoose');
const userRouter = require('./routers/userRouters'); 
const convRouter = require('./routers/convRouters'); 
const User = require('./models/user');
const { SSL_OP_NO_TICKET } = require('constants');

/* EXPRESS APP VARIABLE */
const app = express();

/* SERVER VARIABLES */
const port = process.env.PORT || 4444;
const server = http.createServer(app);

/* WEBSOCKET CONFIG */
const io = socketio(server, {
    cors: {
        origin: '*'
    }
});

/* EXPRESS MIDDLEWARES */
app.use(cors());
app.use(express.json());
app.use(function(req, res, next) {
    req.io = io;
    next();
});
app.use(userRouter);
app.use(convRouter);


io.on('connection', (socket) => {

    console.log('New WebSocket connection');

    socket.on('join', (room) => {
        socket.join(room);
    });

    socket.on('leave', (room) => {
        socket.leave(room);
    })

    // socket.on('getId', async (_id) => {
    //     await User.findByIdAndUpdate(_id, {socketId: socket.id})
    // });

});


// io.on('connection', (socket) => {
//     console.log('New WebSocket connection');

//     socket.on('openConv', async ({username, friend, conv}) => {
//         try {
//             console.log(username, friend, conv)
//             if (conv && !friend) {
//                 await Conv.findById(conv, (err, data) => {
//                     if (data) {
//                         socket.join(conv);
//                         socket.emit('conv', data);
//                     } else {
//                         socket.emit('conv', 'Conv doesn\'t exist!')
//                     }
//                 });
//             } else {
//                 await Conv.find({participants: {$all: [username, friend]}}, (err, data) => {
//                     if (data.length) {
//                         socket.emit('conv', data[0]);
//                         socket.join(mongoose.Types.ObjectId(data[0]._id).toHexString());
//                     } else {
//                         socket.emit('conv', 'Conv doesn\'t exist!')
//                     }
//                 });
//             }
//         } catch (e) {
//             console.log(e);
//         }
//     }) 

//     socket.on('sendMessage', async ({username, message, conv, friend}) => {
//         const date = Date.now();
//         if (conv) {
//             console.log(conv);
//             await Conv.findByIdAndUpdate(conv, {$push: {messages: {
//                 message,
//                 sender: username,
//                 sentAt: date
//             }}});
//             io.to(conv).emit('receiveMessage', {username, message, date, _id: mongoose.Types.ObjectId()});
//         } else {
//             const newConv = new Conv({
//                 participants: [username,friend],
//                 createdAt: date,
//                 messages: [{
//                     sender: username,
//                     message,
//                     sentAt: date
//                 }]
//             });
//             const savedConv = await newConv.save();
//             await socket.join(mongoose.Types.ObjectId(savedConv._id).toHexString());
//             await io.to(mongoose.Types.ObjectId(savedConv._id).toHexString()).emit('receiveMessage', {username, message, date, _id: mongoose.Types.ObjectId()});
//         }
        

        
//     });

//     socket.emit('message', 'Hello there!');
//     socket.on('messageBack', (mes, callback) => {
//         console.log(mes)
//         callback('Delivered!');
//     });

//     socket.on('disconnect', () => {
//         console.log('A client has left!')
//     })
// });

/* SERVER LISTENING */
server.listen(port, () => {
    console.log(`Server listens to port ${port}`);
});

module.exports = io;