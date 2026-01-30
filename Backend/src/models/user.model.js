const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: { 
        type: String,
        required: true
    },
    birthDetails: {
        date: { type: Date, required: true },
        time: { type: String, required: true },
        place: { type: String, required: true }
    }
},
{ timestamps: true }
    );

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;