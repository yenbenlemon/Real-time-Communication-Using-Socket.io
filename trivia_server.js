const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const http = require('http');
const fs = require('fs');

// Used to grab random trivia questions
const randURL 	= "https://opentdb.com/api.php?amount=5";

let triviaQ 		= ""; 	 	// Holds our trivia questions
let gameStarted = false; 	// Has the round started yet?
let round   		= 1;			// What question are we on?

let players = []; // Array of all player data
let winners = []; // Array of winner data

//Helper function for sending 404 message
function send404(response)
{
	response.writeHead(404, { 'Content-Type': 'text/plain' });
	response.write('Error 404: Resource not found.');
	response.end();
}

let server = http.createServer(function (req, res)
{
  if (req.method == 'GET')
	{
		//Add routes here to handle GET requests
		//For example:
		if (req.url == '/')
		{
			//Handle response here for the resource "/"
			fs.readFile('./trivia_game.html', function (err, data){
        res.writeHead(200, {'Content-Type': 'text/html','Content-Length':data.length});
        res.write(data);
        res.end();
			});
		}
		else if(req.url == '/trivia_game.js')
		{
      fs.readFile('./trivia_game.js', function (err, jsFile){
				res.writeHeader(200, {"Content-Type": "text/javascript"});
        res.write(jsFile);
        res.end();
      });
		}
		else if(req.url == '/trivia_q.txt')
		{
      fs.readFile('./trivia_q.txt', function (err, txtData){
				res.writeHeader(200, {"Content-Type": "text/plain"});
        res.write(txtData);
        res.end();
      });
		}
    else if(req.url == '/check.png')
		{
      fs.readFile('./check.png', function (err, imgData){
				res.writeHeader(200, {"Content-Type": "image/png"});
        res.write(imgData);
        res.end();
      });
		}
    else if(req.url == '/x.png')
		{
      fs.readFile('./x.png', function (err, imgData){
				res.writeHeader(200, {"Content-Type": "image/png"});
        res.write(imgData);
        res.end();
      });
		}
	}
	else{ send404(res); } // If not a GET request, send 404 for now by default
});

server.listen(3000);
console.log('server running on port 3000');
const io = require('socket.io')(server);

io.on('connection', socket =>
{
	socket.emit("getPlayers", players); // Send the player list
	socket.emit("getRound", round);  		// Let the player know what question we are on

  if(!gameStarted) // If the game hasn't started yet, lets start it.
	{
		// Reset the questions and send it out to anyone listening
		round = 1;
		io.emit("getRound", round);
		getHTTP(); // Grab the trivia questions
	}

	//add events for that socket
	socket.on('disconnect', () =>
	{
		// Find the player that disconnected and remove them from our array
		for(let i = 0; i < players.length; i++)
		{
			if(players[i].id == socket.id)
			{
				// Update player lists
				players.splice(i,1);
				io.emit("getPlayers", players);
			}
		}

		// If no players, reset trivia
    if(players.length == 0) { gameStarted = false; }
		else { checkStatus(); }
	});

	socket.on("joinGame", data =>
	{
		if(triviaQ != null && triviaQ != "") // Only join if we have a game
    {
      gameStarted = true;

			// Create player details
      players.push({"pName": data, "id": socket.id, "score": 0, "sub": false});
      socket.emit("joinGame", triviaQ); // Send trivia data to player
    }
	});

	// Basic calls for player data, current question, and to display winners
	socket.on("getPlayers", () => { io.emit("getPlayers", players); });
  socket.on("getRound", () => { socket.emit("getRound", round); });
	socket.on("displayWinners", () => { socket.emit("displayWinners", winners); });

	// If submitted, update player score and status
	socket.on("submitted", score =>
	{
		for(let i = 0; i < players.length; i++)
		{
			// Get which player matches with the id
			if(players[i].id == socket.id)
			{
				// Update player data with current score and state they have submitted
				players[i].score = score;
				players[i].sub = true;
				io.emit("getPlayers", players);
			}
		}
		// Check to see if everyone has submitted
		checkStatus();
	});

	// Send message data for chat to everyone
	socket.on("chatToServer", mData => { io.emit("serverToChat", mData); });
});

// Used for our HTTP GET requests
function getHTTP()
{
	// We need to wait for the content to load before trying to use it
	let xmlHttp = new XMLHttpRequest();
	xmlHttp.addEventListener("load", randomTest);

	// Our get call to the database
	xmlHttp.open("GET", randURL);
	xmlHttp.send();
}

// Used to parse our random JSON test before loading
function randomTest()
{
	let jsonObj = JSON.parse(this.responseText);

	// If the response is good, load the test
	if(jsonObj["response_code"] == 0) { triviaQ = jsonObj;}
	else { alert("The request failed for some reason.") }
}

function checkStatus()
{
	let subCount = 0;

	for(let i = 0; i < players.length; i++) { if(players[i].sub) { subCount++; } }

	// If everyone has submitted, set up the next question
	if(subCount > 0 && subCount == players.length)
	{
		round++; // Increment our question count
		for(let j = 0; j < players.length; j++) { players[j].sub = false; }

		// Increment the question count for everyone and start the next question
		if(round <= 5)
		{
			io.emit("getRound", round);
			io.emit("nextQ");
		}
		else // End the round and display the winners
		{
			io.emit("endRound", players);
			getWinners();
		}
		io.emit("getPlayers", players);
	}
}

function getWinners()
{
	winners = []; // Reset the winners array
	let topScore = (round*(-100))-1; // Set score to lowest it could possibly be -1

	for(let i = 0; i < players.length; i++)
	{
		if(players[i].score > topScore) // Empty array and add the new top player
		{
			winners = [];
			winners.push(players[i]);
			topScore = players[i].score
		}
		else if(players[i].score == topScore) { winners.push(players[i]); } // Add player to array
	}

	round = 0; // Set round to finished state
	io.emit("getRound", round);
	io.emit("getWinners", winners);
}
