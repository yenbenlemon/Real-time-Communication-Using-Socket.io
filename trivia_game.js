// Generic letter array used for lettering our answers
const lettersArr = ["a. ", "b. ", "c. ", "d. ", "e. ", "f. "];

// Constant values such as image names and text used for IDs/Names
const checkIMG 	= "check.png";
const xIMG 			= "x.png";
const radioName = "question";
const qName			= "qtxt";
const sStyle 		= "selectbtn";

// Add access to our Buttons
let joinBtn   = document.getElementById('joinBtn');
let submitBtn = document.getElementById("submitBtn");
let chatBtn   = document.getElementById("chatBtn");

// Add event listeners for buttons
joinBtn.addEventListener("click", attemptJoin);
submitBtn.addEventListener("click", submitAnswer);
chatBtn.addEventListener("click", chatToServer);

// Add access to our Divs
let joinDiv   = document.getElementById("joinDiv");
let playerDiv = document.getElementById("playerDiv");
let triviaDiv = document.getElementById("triviaDiv");
let chatDiv   = document.getElementById("chatDiv");

// Get our text box element
let txtBox = document.getElementById("nameBox")

// Set up our socket connection
let socket = io();

// Player information
let pName  = "";
let pScore = 0;
let round  = 1;
let sub    = false;

// Arrays of all our radio objects and images and player names
let radioObjArr	= [];
let imgArr 			= [];
let pNameLabels = [];

// Other data
let testKey     = ""; // The key to grab the questions from JSON
let triviaQ     = ""; // The specific question value
let timeCount   = 0;  // A timer value to count 0-30

// Intervals we use to set question time limits
let limitInterval = setInterval(timeLimit, 30000);
let timeInterval = setInterval(timer, 1000);

function attemptJoin()
{
  if(txtBox.value.trim().length > 0) // if the name box is not empty
  {
    // Set the player name and show our chatbox
    pName = txtBox.value;
    chatDiv.style.visibility = "visible";


    clearInterval(limitInterval);
    clearInterval(timeInterval);
    limitInterval = setInterval(timeLimit, 30000);
    timeInterval = setInterval(timer, 1000);

    socket.emit("joinGame", txtBox.value)
  }
  else { alert("You need to enter a name!"); }
}

// Our main function used to load all the trivia content
function loadTest(testO, testK)
{
  socket.emit("getRound");  // Get which question we are on
  resetIntervals();         // Reset our timers

  if(round > 0) // If game hasn't been completed
  {
    sub = false; // Player has not submitted

  	let aCount         = 0;  // Count of our answers per question
  	let mainOutputArr  = []; // Array to hold all of our finalized html
  	let aOutputArr     = []; // HTML output for answers specifically

  	// Grab our question informatin
  	let question 	= testO[testK][round-1].question;
  	let correct 	= testO[testK][round-1].correct_answer;
  	let aArr  		= [...testO[testK][round-1].incorrect_answers];

  	// Default our img strinf to the cross picture
  	let imgStr = xIMG;

  	// Add the correct answer into our array of answers and shuffle
  	aArr.push(correct);
  	shuffle(aArr);

  	// Create innerHTML content for each answer
  	aArr.forEach(function(answer)
  	{
  		// Change image string based on if the answer is correct or not
  		if (answer === correct) { imgStr = checkIMG; }
  		else { imgStr = xIMG; }

  		/* Push our answers to an output array,
  		We additionally, set up the size of our images and set them to hidden
  		We set names and IDs for use later when we need to pull them */
  		aOutputArr.push
  		(
  			`<label>
  				<input type="radio" name="${radioName}" class ="radio" value="${answer}">
  				${lettersArr[aCount]} :
  				${answer}
  				<img src="${imgStr}" height="20" width="20" id="${imgStr}" class="image" style="visibility: hidden;">
  			</label><br>`
  		)
  		aCount++;
  	})
  	aCount = 0;

  	// Add this question and its answers to the output
  	mainOutputArr.push
  	(
  		`<div class="question" id ="${qName}"> ${question} </div>
  		<div class="answers"> ${aOutputArr.join("")} </div><br>`
  	);

    // Add our new HTML to the page
  	triviaDiv.innerHTML = mainOutputArr.join("");

  	// Populate arrays so we have all radio and image elements
  	populateElementArrays();

   	// Show previously hidden buttons
  	submitBtn.style.visibility = 'visible';
  }
  else { socket.emit("displayWinners"); } // Call for winners since game is over
}

// Generic function to grab our radio and image elements
function populateElementArrays()
{
	radioObjArr = Array.from(document.getElementsByClassName("radio"));
	imgArr 			= Array.from(document.getElementsByClassName("image"));
}

// Generic shuffle function to randomize the answers in our test
function shuffle(arr) { arr.sort(() => Math.random() - 0.5); }

// Generic function to remove all elements in a passed div
function removeAllElements(div) { while(div.firstChild){ div.removeChild(div.firstChild); } }

// Used to verify all questions have been answered
function submitAnswer()
{
	let isAlert     = false; // True is some questions have not been answered
  let isAnswered  = false;
	let txtBlock 		= document.getElementById(qName); // Grab the text element for the question

	// Create an array of radio objects specifically from the current question
	Array.from(document.getElementsByName(radioName)).forEach(function(rObj)
	{
		if(rObj.checked) { isAnswered = true; }
	});

	/* If hasn't been answered, set text to red
	Remind us that we need to now send an alert */
	if(!isAnswered)
	{
		txtBlock.style.color = "red";
		isAlert = true;
	}
	else { txtBlock.style.color = "black"; }

	/* Alert the user that all questions must be answered if necessary
	Otherwise, move onto verifying the answers */
	if (isAlert) { alert("You must answer all questions before checking your answers."); }
	else
  { verifyAnswers(); }
}

// Verifies the selected answers
function verifyAnswers()
{
  submitBtn.style.visibility = 'hidden';
	let isCorrect = 0;

	// Reset visibility of all images
	imgArr.forEach(function(img) { img.style.visibility = "hidden"});

	/* For each radio object that is selected
	Check and see if the radio object shares a position with a checkmark image
	If so, increment our correct answers count */
	for(let i = 0; i < radioObjArr.length; i++)
	{
		if (radioObjArr[i].checked)
		{
			imgArr[i].style.visibility = "visible";
			if (imgArr[i].id === checkIMG)
      {
        isCorrect = 1;
        if(timeCount <= 15) { pScore += 100; }
        else { pScore += 50; } // If 15 seconds have elapsed, point penalty
      }
      else { pScore -= 100; }
		}
	}
  sub = true; // Player has submitted
  socket.emit("submitted", pScore);
}

// Creates the name and score for the player to be displayed to all other players
function addNameLabel(pData)
{
  let label = document.createElement('label'),
      txt   = document.createTextNode(pData.pName + " | Score: " + pData.score);

      // Used to determine if the player has currently submitted
      if(pData.sub) { label.style.color = "MediumSeaGreen"; }
      else { label.style.color = "Tomato"; }

      label.id = pData.id;
      label.appendChild(txt);
      label.appendChild(document.createElement('br'));
      playerDiv.appendChild(label);
}

// Displays each winners name and the score they received to achieve it
function displayWinners(wData)
{
  let label    = document.createElement('label');
  let scoreTxt = document.createTextNode("With a score of: " + wData[0].score);
  label.appendChild(document.createElement('br'));

  // For each person deemed a winner, create their label
  for(let i = 0; i < wData.length; i++)
  {
    let txt = document.createTextNode("Winner: " + wData[i].pName);
    label.appendChild(txt);
    label.appendChild(document.createElement('br'));
  }

  label.appendChild(scoreTxt);
  label.appendChild(document.createElement('br'));

  scoreTxt = document.createTextNode("Everyone must leave to start a new game!");
  label.appendChild(scoreTxt);

  triviaDiv.appendChild(label);
}

function chatToServer()
{
  if(chatBox.value.trim().length > 0) // If the chatbox is not empty
  {
    let wName = ""; // Whisper recipient
    if(whisperBox.value.trim().length > 0) { wName = whisperBox.value; }

    let mData = {"sender": pName, "whisper": wName, "message": chatBox.value};
    socket.emit("chatToServer", mData);
  }
}

// Called every 30 seconds, will force the player to submit and penalize their points
function timeLimit()
{
  if(round > 0 && !sub && pName != "")
  {
    pScore -= 100;
    submitBtn.style.visibility = 'hidden';
    sub = true;
    socket.emit("submitted", pScore);
  }
}

// Called every second, simple 30 second timer
function timer()
{
  if(timeCount == 30) { timeCount = 0; }
  else { timeCount++; }
}

// Reset our intervals whenever we join a game or a new question is loaded
function resetIntervals()
{
  clearInterval(limitInterval);
  clearInterval(timeInterval);
  limitInterval = setInterval(timeLimit, 30000);
  timeInterval = setInterval(timer, 1000);
}

socket.on("joinGame", data =>
{
  radioObjArr = [];   // Reset the radio array
  imgArr 			= [];   // Reset the img array
  triviaQ     = data; // Grab the trivia questions

  removeAllElements(joinDiv);   // Clear the join section
  loadTest(triviaQ, "results"); // Load the question using the trivia data
  socket.emit("getPlayers");
});

socket.on("getRound", rCount =>
{
  round = rCount; // Current question
  if(round == 0) { submitBtn.style.visibility = 'hidden'; } // Don't allow submissions if game is done
});

socket.on("getPlayers", pData =>
{
  pNameLabels         = []; // Empty the player label array
  playerDiv.innerHTML = ""; // Clear the html for where we display the player labels
  pData.forEach(obj => { addNameLabel(obj); }); // Add all new player labels
});

// Server has sent us a message
socket.on("serverToChat", mData =>
{
  // If the receiver is the sender, the whisper recipient,
  // or if the message is not a whisper, display it
  if(mData.sender == pName || mData.whisper == pName || mData.whisper == "")
  {
    let label = document.createElement('label'),
        txt   = document.createTextNode(mData.sender + ": " + mData.message);

        label.appendChild(txt);
        label.appendChild(document.createElement('br'));
        chatDiv.appendChild(label);
  }
});

socket.on("nextQ", () => { loadTest(triviaQ, "results"); });
socket.on("getWinners", wData => {if(pName != "") { displayWinners(wData); }});
socket.on("displayWinners", wData => { displayWinners(wData); });
