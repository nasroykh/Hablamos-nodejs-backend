/* optional modules to install: bad-words, moment */
/* IMPORTING MODULES */
const express = require('express');
const cors = require('cors');
const socketio = require('socket.io');
const http = require('http');

/* IMPORTING LOCAL FILES */
require('./src/db/mongoose');
const userRouter = require('./src/routers/userRouters'); 
const convRouter = require('./src/routers/convRouters'); 
const User = require('./src/models/user');
const Conv = require('./src/models/conv');

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
        console.log(socket.id + ' entered room ' + room);
    });

    socket.on('leave', (room) => {
        socket.leave(room);
        console.log(socket.id + ' leaved room ' + room);
    });

    socket.on('socketid:save', async (_id) => {
        await User.findByIdAndUpdate(_id, {socketId: socket.id});
        console.log('done ' + _id + ' ' + socket.id)
    });

    socket.on('socketid:remove', async (_id) => {
        await User.findByIdAndUpdate(_id, {socketId: ''});
        console.log('removed ' + _id + ' ' + socket.id)
    });

    socket.on('message:seen', async (payload) => {
        let conv = await Conv.findOne({messages: {$elemMatch: {_id: payload._id}}});

        let updatedMessages = conv.messages.slice();

        updatedMessages[updatedMessages.length-1].seenBy.push(payload.userId);

        await Conv.findOneAndUpdate({messages: {$elemMatch: {_id: payload._id}}}, {messages: updatedMessages});

        io.to(conv._id.toString()).emit('message:isseen', {_id: payload.userId, username: payload.username});

    })

});

/* SERVER LISTENING */
server.listen(port, () => {
    console.log(`Server listens to port ${port}`);
});

module.exports = io;