const express = require('express');

const User = require('../models/user');
const router = new express.Router();
const auth = require('../middleware/auth');

//Sign up router
router.post('/users', async (req,res) => {
    try {
        let {username, email, password, firstName, lastName} = req.body;

        if (!username) {
            res.status(400).send('Please provide an username.')
        } else {
            username = username.toLowerCase().trim();
        }

        if (!email) {
            res.status(400).send('Please provide an email.')
        } else {
            email = email.toLowerCase().trim();
        }

        if (!password) {
            res.status(400).send('Please provide a password.')
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

//Login router
router.post('/users/login', async (req, res) => {
    try {

        let {identifier, password} = req.body;
       
        if (identifier) {
            identifier = identifier.toLowerCase().trim();
        }

        const user = await User.findByCredentials(identifier, password);
        const token = await user.generateAuthToken();
        res.send({user, token});
    } catch (e) {
        res.status(400).send(e);
    }
});

//Logout router
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
        req.user.status = 'Offline';
        await req.user.save();
        res.send()
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
        res.send()
    } catch (e) {
        res.status(500).send();
    }
});


router.get('/users', auth, async (req,res) => {
    try {
        const users = await User.find({});
        res.status(200).send(users)
    } catch (e) {
        res.status(404).send(e);
    }
});

router.get('/users/me', auth, async (req,res) => {
    res.send(req.user);
});

router.delete('/users/me', auth, async (req,res) => {
    try {
        await req.user.remove();
        res.send(req.user);
    } catch (e) {
        res.status(500).send(e);
    }
});


module.exports = router;