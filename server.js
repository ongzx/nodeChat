var app = require('express')();
var http = require('http').Server(app);
var io = require('/usr/local/lib/node_modules/socket.io')(http);
var __ = require('underscore-node');


app.get('/', function(req, res){
  res.sendfile('index.html');
});

var connected_user = [];
var rooms = ['room1','room2','room3'];

io.on('connection', function(socket){

  console.log('a user connected : '+ socket.id);

  socket.on('adduser', function(username){
		// store the username in the socket session for this client
		socket.username = username;
		// store the room name in the socket session for this client
		socket.room = 'room1';
		// add the client's username to the global list
		connected_user.push({'username':username});
    console.log(connected_user);

		// send client to room 1
		socket.join('room1');
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected to room1');
		// echo to room 1 that a person has connected to their room
		socket.broadcast.to('room1').emit('updatechat', 'SERVER', username + ' has connected to this room');
		socket.emit('updaterooms', rooms, 'room1');
	});

  // when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.in(socket.room).emit('updatechat', socket.username, data);
	});

  socket.on('switchRoom', function(newroom){
		// leave the current room (stored in session)
		socket.leave(socket.room);
		// join new room, received as function parameter
		socket.join(newroom);
		socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
		// sent message to OLD room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
		// update socket session room title
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
		socket.emit('updaterooms', rooms, newroom);
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global connected_user list
    connected_user = __.reject(connected_user, function(el) { return el.username === socket.username; });
    console.log(connected_user);
		// delete connected_user[socket.username];
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', connected_user);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
	});

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
