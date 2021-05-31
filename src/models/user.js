const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    firstName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Please provide a valid email adress.');
            }
        }
    },
    password: {
        type: String,
        required: true
    },
    profilePicture: {
        type: Buffer
    },
    friends: [
        {
            type: String
        }
    ],
    friendRequests: [
        {
            type: String
        }
    ],
    status: {
        type: String,
        default: 'Online'
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    socketId: {
        type: String
    }
});

userSchema.statics.findByCredentials = async (identifier, password) => {

    let user;

    if (validator.isEmail(identifier)) {
        user = await User.findOne({email: identifier});
    } else {
        user = await User.findOne({username: identifier});
    }


    if (!user) {
        throw new Error('Unable to login');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    return user;
}

userSchema.methods.toJSON = function() {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;

    return userObject;
};

userSchema.methods.generateAuthToken = async function() {
    const user = this;
    const token = jwt.sign({_id: user._id.toString()}, 'wya3tinima7nayamima');

    user.tokens = await user.tokens.concat({token});
    await user.save();

    return token;
};

userSchema.pre('save', async function (next) {
    const user = this;

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
});


const User = mongoose.model('User', userSchema);



module.exports = User;