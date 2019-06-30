const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    bills: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bill',
    }],
});

const User = mongoose.model('Bill', UserSchema);

module.exports = User;
