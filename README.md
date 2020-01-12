# Real-time-Communication-Using-Socket.io

Updated: 1/10/2020

The following project is the creation of a functional Trivia game that will
persist as long as there are players within the session.

The point is to use socket.io for personal and global communication
between the server and the clients.

Players that enter an already existing round will be able to participate until
the game is over. If all players leave, the game will end until a new
player enters. The game will then restart.

###### Project Assets:

- Node.js
- XMLHttpRequest
- Socket.io
- HTML
- JSON

## Instructions

Run "node trivia_server.js" in the cmd prompt while pointing to this folder
Server runs on http://localhost:3000/

1. Load the webpage after starting the server (load a second webpage for player 2)
2. Enter a name (the game will refuse blank names)
3. Click Join Game button
4. Game will start, select an answer and submit.
5. The game will not accept the submit without a selection
6. The players will be displayed at the top of the page as they enter the game
7. The players will have their current score displayed beside their names
8. Negative values can be achieved through wrong answers
9. After five questions, the game will end and the players with the higher score will be displayed as the winners at the bottom of the webpage
10. A player can join mid-match, but will start on the current question for that round
11. If a player joins after a round ends, they will only see the winners listed
12. All players must leave the page to restart the game and start the next round
13. If a player leaves before finishing the game, their score won't be counted at the end
14. If a player has not submitted, their name and details will be red
15. If the player has submitted, their color will change to green
16. All players must be in submitted status to advance
17. If a player is the last to need to submit and leaves, the game will continue

## Additions

###### 30 Second Timer
  - The player only has 30 seconds per question to answer
  - If they do not answer, they will on to the next question
  - The game will take this as the player inputting an incorrect answer
  - The player will lose 100 points

###### Point penalty based on time
  - Player will receive 100 points if answering correct within the first 15 seconds
  - Otherwise players will only receive 50 points until the time limit is reached

###### Chat integration
  - Chat window integration appears when player joins
  - As many messages as wanted can be shown, there's no limit
  - Player name is displayed beside messages

###### Whisper integration for chat
  - If the player adds a whisper name to the chat, only the whispered player will receive it
  - If the whispered player doesn't exist, the message will only be displayed to the sender
  - The player that sends the message will also see the message displayed
