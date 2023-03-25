const express = require('express');
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');
const socketio = require('socket.io');
const formatMessage = require('./models/messages');
const mongoClient = require('mongodb').MongoClient;
const MongoClient = require('mongodb').MongoClient;

const dbname = 'myapp';
const chatCollection = 'chats'; //collection to store all chats
const userCollection = 'onlineUsers'; //collection to maintain list of currently online users

const port = 5000;
const database = 'mongodb://localhost:27017/';
const app = express();

const server=http.createServer(app);
const io = socketio(server);



io.on('connection', (socket) => {
    console.log('New User Logged In with ID '+socket.id);
    
    //Collect message and insert into database
    socket.on('chatMessage', (data) =>{ //recieves message from client-end along with sender's and reciever's details
        var dataElement = formatMessage(data);
        console.log(dataElement);
        MongoClient.connect('mongodb://localhost:27017/', { useNewUrlParser: true, useUnifiedTopology: true })
        .then((client) => {
          const db = client.db('myapp');
          console.log('Database connected!');
  
          const onlineUsers = db.collection(userCollection);
          const chat = db.collection(chatCollection);
        
          chat.insertOne(dataElement, (err, res) => {
            if (err) throw err;
        
            socket.emit('message', dataElement);
        
            onlineUsers.findOne({ name: data.toUser }, (err, res) => {
              if (err) throw err;
        
              if (res != null) {
                socket.to(res.ID).emit('message', dataElement);
              }
        
              client.close();
            });
          });
        })
        .catch((err) => console.log(err));
    });

    socket.on('userDetails',(data) => { //checks if a new user has logged in and recieves the established chat details
      MongoClient.connect(database, { useNewUrlParser: true, useUnifiedTopology: true })
      .then((client) => {
        console.log('Database connected!');
        const db = client.db(dbname);
        
        console.log(data);
        const onlineUser = { //forms JSON object for the user details
          "ID": socket.id,
          "name": data.fromUser
        };
    
        const currentCollection = db.collection(chatCollection);
        const online = db.collection(userCollection);
    
        Promise.all([
          online.insertOne(onlineUser),
          currentCollection.find({ //finds the entire chat history between the two people
            "from" : { "$in": [data.fromUser, data.toUser] },
            "to" : { "$in": [data.fromUser, data.toUser] }
          },{projection: {_id:0}}).toArray()
        ])
          .then(([insertResult, findResult]) => {
            console.log(onlineUser.name + " is online...");
            socket.emit('output', findResult); //emits the entire chat history to client
          })
          .catch((err) => {
            throw err;
          })
          .finally(() => {
            client.close();
          });
      })
      .catch((err) => console.log(err));
    
    
    });  
    var userID = socket.id;
    socket.on('disconnect', () => {
      MongoClient.connect(database, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
        if (err) throw err;
        
        const onlineUsers = client.db(dbname).collection(userCollection);
        const myquery = { "ID": userID };
      
        onlineUsers.deleteOne(myquery, (err, res) => {
          if (err) throw err;
          
          console.log(`User ${userID} went offline...`);
          client.close();
        });
      });
      
    });
});

app.use(express.static(path.join(__dirname,'front')));

server.listen(port, () => {
    console.log(`Chat Server listening to port ${port}...`);
});