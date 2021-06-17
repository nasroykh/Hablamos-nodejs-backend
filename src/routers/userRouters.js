const express = require('express');

const User = require('../models/user');
const router = new express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/uploadFile');
const sharp = require('sharp');




//Sign up router
router.post('/users/signup', async (req,res) => {
    try {
        let {username, email, password, firstName, lastName} = req.body;

        if (!username) {
            return res.status(400).send('Please provide a username.')
        } else {
            username = username.toLowerCase().trim();
        }

        if (!email) {
            return res.status(400).send('Please provide an email.')
        } else {
            email = email.toLowerCase().trim();
        }

        if (!password) {
            return res.status(400).send('Please provide a password.')
        }

        if (firstName) {
            firstName = firstName.trim();
        }

        if (lastName) {
            lastName = lastName.trim();
        }

        const user = new User({username, email, password, firstName, lastName});
        
        await user.save();
        const token = await user.generateAuthToken();
    
        res.status(201).send({user, token});
    } catch (e) {
        res.status(400).send(e)
    }
});

//Upload profile picture router
router.post('/users/picture', auth, upload.single('picture'), async (req, res) => {

    const buffer = await sharp(req.file.buffer).resize({width: 200, height: 200}).png().toBuffer();

    req.user.profilePicture = buffer;
    
    await req.user.save();
    
    res.status(201).send('Picture uploaded');
}, (error, req, res, next) => {
    res.status(400).send({error: error.message});
});

router.get('/users/:_id/picture', async (req, res) => {
    try {
        const user = await User.findById(req.params._id)

        if (!user || !user.profilePicture) {
            const admin = await User.findById('60c787e569a636aac0c7e25d');
            res.set('Content-Type', 'image/png');
            return res.status(200).send(admin.profilePicture);
        }

        res.set('Content-Type', 'image/png');
        res.status(200).send(user.profilePicture);

    } catch (e) {
        res.status(404).send()
    }
});

//Login router
router.post('/users/login', async (req, res) => {
    try {

        let {identifier, password} = req.body;

        if (identifier) {
            identifier = identifier.toLowerCase().trim();
        }

        const user = await User.findByCredentials(identifier, password);
        const token = await user.generateAuthToken();
        
        for (let i = 0; i < user.friends.length; i++) {
            let friend = await User.findById(user.friends[i]);
            
            user.friends[i] = {
                _id: friend._id,
                username: friend.username
            }
        }
        
        res.status(200).send({user, token});
    } catch (e) {
        res.status(400).send('Unable to login');
    }
});

//Logout router
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
        req.user.status = 'Offline';
        await req.user.save();
        res.status(200).send('Logged out')
    } catch (e) {
        res.status(500).send();
    }
});

//Log out of all devices router
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        req.user.status = 'Offline';
        await req.user.save();
        res.status(200).send('Logged out of all devices');
    } catch (e) {
        res.status(500).send();
    }
});

router.get('/users/check', auth, async (req, res) => {
    try {
        if (req.user) {
            for (let i = 0; i < req.user.friends.length; i++) {
                let friend = await User.findById(req.user.friends[i]);
                
                req.user.friends[i] = {
                    _id: friend._id,
                    username: friend.username
                }
            }
            res.status(200).send({user: req.user, token: req.token});
        } else {
            res.status(404).send({error: 'Session expired'});
        }
    } catch (e) {
        res.status(500).send(e);
    }
});

router.get('/users', auth, async (req, res) => {
    try {
        let {username} = req.query;

        if (username) {
            username = username.toLowerCase().trim();
        }

        if (!username) {
            return res.status(404).send('Enter a username');
        }

        let users = await User.find({username: {$regex: `^${username}`}});
        
        if (users.length) {
            users = users.filter(user => user._id.toString() !== req.user._id.toString());
        }
        
        if (!users.length) {
            return res.status(404).send('Not found');
        }

        for (let i = 0; i < users.length; i++) {
            let isFriend = req.user.friends.includes(users[i]._id);
            let sentRequest = users[i].friendRequests.includes(req.user._id);

            if (isFriend || sentRequest) {
                users.splice(i, 1);
                i--;
            }

            if (users[i]) {
                users[i].friends = undefined;
                users[i].friendRequests = undefined;
                users[i].email = undefined;
            }
        }

        res.status(200).send(users);
    } catch (e) {
        res.status(500).send(e);
    }
});

router.post('/users/add', auth, async (req, res) => {
    try {
        let {_id} = req.body;
        
        let user = await User.findById(_id);

        if (!user) {
            return res.status(404).send('User not found');
        }

        if (user.friends.includes(req.user._id)) {
            return res.status(400).send('Already friends');
        }

        if (req.user.friendRequests.includes(_id)) {
            return res.status(400).send('User already sent you a request');
        }

        if (user.friendRequests.includes(req.user._id)) {
            return res.status(400).send('Already sent');
        }

        if (_id.toString() === req.user._id.toString()) {
            return res.status(400).send('Cannot send request to yourself');
        }

        req.io.to(user.socketId).emit('notify:request', {_id: req.user._id, username: req.user.username});

        await User.findByIdAndUpdate(_id, {$push: {friendRequests: req.user._id}});

        res.status(200).send(user);

    } catch (e) {
        res.status(500).send(e);
    }
});

router.post('/users/accept', auth, async (req, res) => {
    try {
        let {_id} = req.body;

        let user = await User.findById(_id);

        if (!user) {
            return res.status(404).send('User not found');
        }
        
        if (user.friends.includes(req.user._id)) {
            return res.status(400).send('Already friends');
        }

        if (!req.user.friendRequests.includes(_id)) {
            return res.status(404).send('No request sent from this user');
        }

        req.user.friendRequests = await req.user.friendRequests.filter(request => request.toString() !== _id.toString());
        await User.findByIdAndUpdate(req.user._id, {friendRequests: req.user.friendRequests});
        
        await User.findByIdAndUpdate(_id, {$push: {friends: req.user._id}});

        await User.findByIdAndUpdate(req.user._id, {$push: {friends: _id}});

        req.io.to(user.socketId).emit('notify:accepted', {_id: req.user._id, username: req.user.username});

        res.status(200).send('Accepted !');

    } catch (e) {
        res.status(500).send(e);
    }
});

router.get('/users/friends', auth, async (req, res) => {
    try {
        
        let friends = [];

        for (let i = 0; i < req.user.friends.length; i++) {
            let friend = await User.findById(req.user.friends[i]);

            friends.push({
                _id: friend._id,
                username: friend.username,
                status: friend.status
            })
        }

        if (!friends.length) {
            return res.status(404).send('No friends found');
        }

        res.status(200).send(friends);
    } catch (e) {
        res.status(500).send(e);
    }
});

router.get('/users/requests', auth, async (req, res) => {
    try {
        let requests = [];

        for (let i = 0; i < req.user.friendRequests.length; i++) {
            let request = await User.findById(req.user.friendRequests[i]);

            requests.push({
                _id: request._id,
                username: request.username
            })
        }

        if (!requests.length) {
            return res.status(404).send('No requests found');
        }

        res.status(200).send(requests);
    } catch (e) {
        res.status(500).send(e);
    }
});

router.delete('/users/friends', auth, async (req, res) => {
    try {
        let {_id} = req.query;

        let user = await User.findById(_id);

        if (!req.user.friends.includes(_id)) {
            return res.status(404).send('Friend not found');
        }

        user.friends = await user.friends.filter(friend => friend.toString() !== req.user._id.toString());
        req.user.friends = await req.user.friends.filter(friend => friend.toString() !== _id.toString());

        await User.findByIdAndUpdate(_id, {friends: user.friends})
        await User.findByIdAndUpdate(req.user._id, {friends: req.user.friends})

        res.status(200).send('Friend deleted');

    } catch (e) {
        res.status(500).send(e);
    }
});

router.delete('/users/requests', auth, async (req, res) => {
    try {
        let {_id, sent} = req.query;
        
        if (sent) {
            let user = await User.findById(_id);

            if (!user) {
                return res.status(404).send('User not found');
            }

            if (!user.friendRequests.includes(req.user._id)) {
                return res.status(404).send('No request sent to this user');
            }

            if (user.friends.includes(req.user._id)) {
                return res.status(400).send('Already friends');
            }
    
            if (req.user.friendRequests.includes(_id)) {
                return res.status(400).send('User already sent you a request');
            }

            user.friendRequests = user.friendRequests.filter(request => request.toString() !== req.user._id.toString());
            await User.findByIdAndUpdate(_id, {friendRequests: user.friendRequests});
            
            return res.status(200).send(user);
        }

        if (!req.user.friendRequests.includes(_id)) {
            return res.status(404).send('Request not found');
        }


        req.user.friendRequests = await req.user.friendRequests.filter(request => request.toString() !== _id.toString());

        await User.findByIdAndUpdate(req.user._id, {friendRequests: req.user.friendRequests})

        res.status(200).send('Request deleted');

    } catch (e) {
        res.status(500).send(e);
    }
});

module.exports = router;