const express = require('express');
const authroutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes');
const cookieParser = require('cookie-parser');

const app = express();

app.use(express.json());
app.use(cookieParser());


app.use('/api/auth', authroutes);
app.use('/api/chats', chatRoutes);

app.get('/', (req, res) => {
    res.send('Welcome to the Astrologer AI Backend!');
});



module.exports = app;