const app = require('./src/app');
const dotenv = require('dotenv').config();
const connectDb = require("./src/db/db");
const initSocketServer = require('./src/sockets/socket.server');

const http = require('http');
const httpServer = http.createServer(app);


connectDb();
initSocketServer(httpServer);

const PORT = process.env.PORT || 3000;



httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
