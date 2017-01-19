var http = require('http')
var socket = require('socket.io')
var fs = require('fs')
var express = require('express')
var session = require('express-session')
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser');


var app = express()
var server = http.createServer(app)
var io = socket(server)
var cnt = 0
var rooms = []
var users = {}

var emptyBoard = [[-1, -1, -1],
				 [-1, -1, -1],
				 [-1, -1, -1]]

app.set('view engine', 'ejs')
app.set('views', './')
app.use(bodyParser.urlencoded({ extended: true }))
app.use( cookieParser() )
app.use(express.static('./'))
app.use(session(
{
	secret: 'dfgfsgfsgsf', 
	resave: false, 
	saveUninitialized: true
}))


app.get('/', (req, res) =>
{
	var username
	if (!req.cookies.username)
	{
		username = 'Anonimowy'
		res.cookie('username', username)
	}
	else
		username = req.cookies.username
	res.render('main', {'username': username})
})

app.get('/roomsList', (req, res) =>
{
	res.render('roomsList', {'rooms': rooms, 'username': req.cookies.username})
})

app.get('/changeUsername', (req, res) =>
{
	res.cookie('username', req.query.newUsername)
	res.redirect(req.query.returnUrl)
})

app.get('/createRoom', (req, res) =>
{
	console.log('Created room: ' + req.query.name)
	var board = [[-1, -1, -1],
				 [-1, -1, -1],
				 [-1, -1, -1]]
	rooms.push({'name': req.query.name, 'players': [], 'board': board})
	res.redirect('/rooms/' + (rooms.length - 1))
})

app.get('/rooms/:id', (req, res) => 
{
	var id = req.params.id
	if (rooms[id].players.length >= 2)
		res.redirect('/roomsList')
	else
		res.render('board', {'name': rooms[id].name, 'roomNo': id, 'username': req.cookies.username})
})

io.on('connection', function(socket) 
{
    console.log('Client connected: ' + socket.id)
    /*
    socket.emit('id', cnt++)
    if (cnt == 2)
    {
    	io.emit('start', {'id': Math.floor(2*Math.random())})
    }
    */
    socket.on('newgame', function()
    {
    	var roomNo = users[socket.id]
    	rooms[roomNo].board = [[-1, -1, -1],
				 			   [-1, -1, -1],
			    			   [-1, -1, -1]]
    	//console.log(emptyBoard)
    	for (var i = 0; i < rooms[roomNo].players.length; i++)
    		rooms[roomNo].players[i].emit('newgame')
    	//io.emit('newgame')
    })
    socket.on('move', function(data)
    {
    	var roomNo = users[socket.id]
    	rooms[roomNo].board[data.x][data.y] = data.id
    	//console.log(emptyBoard)
    	for (var i = 0; i < rooms[roomNo].players.length; i++)
    		rooms[roomNo].players[i].emit('move', {'board': rooms[roomNo].board, 'id': data.id})
    	//io.emit('move', {'id': data.id, 'x': data.x, 'y': data.y})
    })
	socket.on('join', function(roomNo)
	{
		socket.emit('id', rooms[roomNo].players.length)
		rooms[roomNo].players.push(socket)
		users[socket.id] = roomNo
		if (rooms[roomNo].players.length == 2)
		{
			var id = Math.floor(2*Math.random())
			rooms[roomNo].board = [[-1, -1, -1],
				 			   	   [-1, -1, -1],
			    			   	   [-1, -1, -1]]
			for (var i = 0; i < 2; i++)
				rooms[roomNo].players[i].emit('start', {'id': id})
		}
	})
	socket.on('disconnect', function()
	{
		console.log('Client disconnected: ' + socket.id)
		var roomNo = -1
		for (var i = 0; i < rooms.length; i++)
			for (var j = 0; j < rooms[i].players.length; j++)
				if (rooms[i].players[j] == socket)
				{
					rooms[i].players.splice(j, 1)
					roomNo = i
				}
		if (roomNo != -1 && rooms[roomNo].players.length == 0)
		{
			//rooms[roomNo].players[0].emit('newgame')
			rooms[roomNo].board = [[-1, -1, -1],
				 			      [-1, -1, -1],
			    			      [-1, -1, -1]]
			//rooms[roomNo].players[0].emit('id', rooms[roomNo].players.length - 1)
		}
		else if (roomNo != -1 && rooms[roomNo].players.length > 0)
		{
			rooms[roomNo].players[0].emit('withdrawal')
			rooms[roomNo].players[0].emit('id', rooms[roomNo].players.length - 1)
		}
		delete users.socket
	})
})


server.listen(3000)
console.log('ok')

