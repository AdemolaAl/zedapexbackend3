const express = require('express');
const app = express();
const auth = require('./auth.js');
const route = require('./route.js');
const PORT = 3000;
const session = require('express-session');
const flash = require('express-flash');
const MongoDBStore = require('connect-mongodb-session')(session);
const passport = require('passport');
const myDB = require('./connection');
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/pictures', express.static(process.cwd() + '/pictures'));;

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.setHeader('Connection', 'keep-alive');
    next();
  });


app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}))


  

app.use(flash());
app.use(passport.initialize());

app.use(passport.session())

app.set('view engine', 'pug')

app.set('views', './views/pug')


const messages = [];

const MAX_MESSAGES = 1000;

// Clean up messages older than 24 hours
setInterval(() => {
    const now = new Date();
    const cutoffTime = now.getTime() - (24 * 60 * 60 * 1000); // 24 hours in milliseconds

    // Find messages older than 24 hours and remove them
    while (messages.length > 0 && messages[0].timestamp < cutoffTime) {
        messages.shift(); // Remove the oldest message
    }
}, 1000 * 60 * 60);


myDB(async client => {
    const userDB = await client.db('Zedapex').collection('users');
    const productDB = await client.db('Zedapex').collection('products');
    const DB = await client.db('Zedapex');
    auth(app, userDB);
    route(app, userDB, DB, productDB);


    io.on('connection', (socket) => {
        console.log('a user connected');
    
        // Send previous messages to the new user
        socket.emit('load old messages', messages);
    
        // Handle new messages
        socket.on('chat message', (msg) => {
            const message = {
                user: socket.id, // You can use a username or any other identifier instead of socket.id
                content: msg,
                timestamp: new Date()
            };
    
            messages.unshift(message);

            // If the number of messages exceeds the limit, remove the oldest messages
            while (messages.length > MAX_MESSAGES) {
                messages.pop(); // Remove the oldest message
            }
    
            // Broadcast the message to all connected clients
            io.emit('chat message', message);
        });
    
        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('user disconnected');
        });
    });

}).catch(e => {
    app.route('/').get((req, res) => {
        res.render('index', { title: e, message: 'Unable to connect to database' });
    });
});


http.listen(PORT, (error) => {
    if (!error)
        console.log("Server is Successfully Running, and App is listening on port " + PORT);
    else
        console.log("Error occurred, server can't start", error);
});
