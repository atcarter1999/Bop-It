//Arduino Stuff Variables
let serial;
let latestData = "still not working";  // you'll use this to write incoming data to the canvas
let mData;
let xPos = 0;
let yPos = 0;
let potValue = 0;
let jClick = 0;
let outMessage = "L";

//Graphics Variables
var pullValue = 0;
var leftTwistColor = '#FDD023';
var middleButtonWeight = 1;
var middleButtonSize = 0;
let blueberry;
let lemonFriday;

var sceneValue = 0;
var startOption = true;

//Game Variables
var score = 0;
var timeDecrease = 0;
var gameText = 'Ready?';
var inputValue = 0;
var randomNumber;
var previousRandom = 0;

//Audio Variables
let taskVoice;
let loseSound;
let bopSound;
let pullSound;
let twistSound;
let pitchChange;
let autoFilt;
let cheb;

let bopPlay = true;
let twistPlay = true;
let pullPlay = true;

function preload()
{
	blueberry = loadFont('Blueberry.ttf');
	lemonFriday = loadFont('LemonFriday.ttf');
	randomNumber = random([1, 2, 3]);
}

function setup() 
{
	createCanvas(1200, 600);
	imageMode(CENTER);

	//bop Synth
	bopSound = new Tone.MetalSynth(
	{
		"frequency"  : 200 ,
		"envelope"  : {
			"attack"  : 0.001 ,
			"decay"  : 1.4 ,
			"release"  : 0.2
		}  ,
		"harmonicity"  : 5.1 ,
		"modulationIndex"  : 32 ,
		"resonance"  : 4000 ,
		"octaves"  : 1.5
	}).toDestination();

	//pitch changer for lose sound
	pitchChange = new Tone.PitchShift(
	{
		"pitch": -5,
		"windowSize": 0.05,
		"delayTime": 0.3,
		"feedback": 0.2,
		"wet": 0.5
	}).toDestination();	

	//lose game sound effect synth
	loseSound = new Tone.Synth(
	{
		"portamento" : 0.2,
		"oscillator": {
			"type": "sawtooth"
		},
		"envelope": {
			"attack": 0.03,
			"decay": 0.1,
			"sustain": 0.2,
			"release": 0.02
		}
	}).toDestination();
	loseSound.connect(pitchChange);

	//pull sound effect autofilter
	autoFilt = new Tone.AutoFilter(
	{
		"frequency" : 1,
		"type" : "sine",
		"depth" : 1,
		"baseFrequency" : 200,
		"octaves" : 2.6,
		"filter" : {
			"type" : "lowpass",
			"rolloff" : -12,
			"Q" : 1
		},
		"wet": 0.5
	}).toDestination();

	//pull sound effect synth
	pullSound = new Tone.MembraneSynth(
	{
		"pitchDecay"  : 0.2 ,
		"octaves"  : 1.2 ,
		"oscillator"  : {
			"type"  : "sine"
	}  ,
		"envelope"  : {
			"attack"  : 0.001 ,
			"decay"  : 0.8 ,
			"sustain"  : 0.01 ,
			"release"  : 1.4 ,
			"attackCurve"  : "exponential"
		}
	}).toDestination();
	pullSound.connect(autoFilt);

	cheb = new Tone.Chebyshev(
	{
		"order" : 11,
		"wet": 0.5
	}).toDestination();

	//twist FM synth
	twistSound = new Tone.FMSynth(
	{
		"harmonicity": 0.5,
		"modulationIndex": 1.2,
		"oscillator": {
			"type": "fmsawtooth",
			"modulationType" : "sine",
			"modulationIndex" : 20,
			"harmonicity" : 3
		},
		"envelope": {
			"attack": 0.05,
			"decay": 0.3,
			"sustain": 0.1,
			"release": 1.2
		},
		"modulation" : {
			"volume" : 0,
			"type": "triangle"
		},
		"modulationEnvelope" : {
			"attack": 0.35,
			"decay": 0.1,
			"sustain": 1,
			"release": 0.01
		}
	}).toDestination();
	twistSound.connect(cheb);

	//voice task player (instructions)
	taskVoice = new Tone.Players({
		taskVoice1: "BopIt.mp3",
		taskVoice2: "TwistIt.mp3",
		taskVoice3: "PullIt.mp3"
	}).toDestination();

	//Joystick stuff
	serial = new p5.SerialPort();
	serial.open("COM5");
	serial.onData(gotData);
}

//serial input functions

function gotData()
{
	let currentString = serial.readLine();  // read the incoming string
	trim(currentString);                    // remove any trailing whitespace
	if (!currentString) 
	{
		return;
	}          								// if the string is empty, do no more
	//console.log(currentString);             // print the string
	latestData = currentString;            // save it for the draw method
}

function game()
{
	if(randomNumber == 1)
		randomNumber = random([2, 3]);
	else if(randomNumber == 2)
		randomNumber = random([1, 3]);
	else
		randomNumber = random([1, 2]);

	if(randomNumber == 1)
	{
		gameText = 'Bop It!';
		taskVoice.player("taskVoice1").start();
	}
	else if(randomNumber == 2)
	{
		gameText = 'Twist It!';
		taskVoice.player("taskVoice2").start();
	}
	else
	{
		gameText = 'Pull It!';
		taskVoice.player("taskVoice3").start();
	}

	setTimeout(gameCheck, 3000 - timeDecrease);
}

function gameCheck()
{
	if(inputValue == randomNumber)
	{
		inputValue = -1;
		timeDecrease += 50;
		score++;
		serial.write("H");
		game();
	}
	else
	{
		sceneValue = 2;
		loseSound.triggerAttackRelease("G4", "8n", "+0.0");
	}
}

function endGame()
{
	sceneValue = 2;
}

function draw()
{
	mData = latestData.split(" ");
	console.log(mData);

	background(0, 128, 0);

	//start screen
	if(sceneValue == 0)
	{
		textFont(blueberry, 60);
		text('Bop It', 500, 100);

		rect(500, 250, 200, 100, 15);
		textFont(blueberry, 30);
		text('Start', 555, 300);
	}

	//game screen
	if(sceneValue == 1)
	{
		//Bop It frame
		fill(0);
		circle(350, 300, 250);
		rect(140, 240, 120, 120, 15);
		rect(440, 240, 500, 120, 15);

		fill(255);
		strokeWeight(0);
		beginShape(TRIANGLES);
			vertex(150, 360);
			vertex(195, 330);
			vertex(240, 360);

			vertex(460, 360);
			vertex(520, 330);
			vertex(580, 360);

			vertex(575, 360);
			vertex(635, 330);
			vertex(695, 360);

			vertex(690, 360);
			vertex(750, 330);
			vertex(810, 360);

			vertex(805, 360);
			vertex(865, 330);
			vertex(925, 360);
		endShape();

		fill(255);
		circle(350, 300, 230);

		//middle button (button)
		bop();

		fill('#461D7C');
		strokeWeight(middleButtonWeight);
		circle(350, 300, 180 - middleButtonSize);

		//text stuff
		fill(150);
		strokeWeight(1);
		textFont(blueberry, 48);
		text('Bop It', 280, 310);

		textSize(16);
		text('Twist It', 155, 280);
		text('Pull It', 880, 280);

		//Right Pull (joystick)
		fill('#461D7C');
		strokeWeight(1);
		rect(940, 280, 120, 40);
		circle(1020 + pullValue, 300, 100);

		pull();

		//Left Twist (pointeometer)
		fill(leftTwistColor);
		quad(40, 240,
			 40, 360,
			 140, 320,
			 140, 280);

		twist();

		//score counter
		fill(0);
		textFont(lemonFriday, 30);
		text('Score: ' + score, 50, 50);
		//text('random: ' + randomNumber, 50, 90);

		//game text
		textFont(blueberry, 48);
		text(gameText, 500, 50);

		//quit button
		fill(255);
		rect(1050, 50, 100, 50, 15);
		textFont(blueberry, 30);
		fill(0);
		text('Quit', 1060, 80);

		//sounds
	}

	//end game screen
	if(sceneValue == 2)
	{
		textFont(blueberry);
		textSize(48);
		text('Game Over', 500, 200);
		textSize(30);
		text('Score:', 550, 300);

		textFont(lemonFriday);
		text(score, 650, 310);
	}
}

function mousePressed()
{
	if(startOption == true)
	{
		if(mouseX > 500 && mouseX < 700)
		{
			if(mouseY > 250 && mouseY < 350)
			{
					sceneValue = 1;
					startOption = false;
					setTimeout(game, 1000);
			}
		}
	}
	else
	{
		if(mouseX > 1050 && mouseX < 1150)
		{
			if(mouseY > 50 && mouseY < 100)
			{
				sceneValue = 2;
			}
		}
	}
}

function twist()
{
	if(mData[2] > 2)
	{
		if(twistPlay == true)
		{
			twistSound.triggerAttackRelease("G4", "4n", "+0.0");

			twistPlay = false;
			pullPlay = true;
			bopPlay = true;
		}

		leftTwistColor = '#e6be20';
		inputValue = 2;
	}
	else
		leftTwistColor = '#FDD023';
}

function pull()
{
	if(mData[0] > 300 || mData[0] < -300 || mData[1] > 300 || mData[0] < -300)
	{
		if(pullPlay == true)
		{
			pullSound.triggerAttackRelease("G4", "4n", "+0.0");

			pullPlay = false;
			bopPlay = true;
			twistPlay = true;
		}

		pullValue = 40;
		inputValue = 3;
	}
	else
		pullValue = 0;
}

function bop()
{
	if(mData[3] == 0)
	{
		if(bopPlay == true)
		{
			bopSound.triggerAttackRelease("G4", "4n", "+0.0");

			bopPlay = false;
			pullPlay = true;
			twistPlay = true;
		}

		middleButtonWeight = 5;
		middleButtonSize = 5;
		inputValue = 1;
	}
	else
	{
		middleButtonWeight = 1;
		middleButtonSize = 0;
	}
}