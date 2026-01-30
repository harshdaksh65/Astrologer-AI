const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


async function registerUser(req, res) {

    const { username, email, password , birthDetails:{ date, time, place} } = req.body;

    const isUserAlreadyExists = await userModel.findOne({ email })

    if (isUserAlreadyExists) {
        res.status(400).json({ message: "User already exists" });
    }


    const hashPassword = await bcrypt.hash(password, 10);


    const user = await userModel.create({
        username,
        email,
        password: hashPassword,
        birthDetails: {
            date,
            time,
            place
        }
    })

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)


    res.cookie("token", token)


    res.status(201).json({
        message: "User registered successfully",
        user: {
            email: user.email,
            _id: user._id,
            Name: user.username 
        }
    })
}

async function loginUser(req, res) {

    const { email, password } = req.body;

    const user = await userModel.findOne({
        email
    })

    if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);


    if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);


    res.cookie("token", token);


    res.status(200).json({
        message: "user logged in successfully",
        user: {
            email: user.email,
            _id: user._id,
            Name: user.username
        }
    })

}


module.exports = {
    registerUser,
    loginUser
}