var boardElement = document.querySelector(".tenuki-board");
var game = new tenuki.Game(boardElement);
game.setup({
  boardSize: 8
});

game.callbacks.postRender = function(game) {
  if (game.currentState().pass) {
    console.log(game.currentState().color + " passed");
  }

  game.currentState().intersections.forEach(function(intersection) {
    if (!midiOutput) return false;
    var channel = coordinatesToNote(intersection);
    if (intersection.value === "white") {
      console.log(channel, intersection.x, intersection.y);
      midiOutput.send([144, channel, 3]);
    } else if (intersection.value === "black") {
      console.log(channel, intersection.x, intersection.y);
      midiOutput.send([144, channel, 41]);
    } else if (intersection.value === "empty") {
      midiOutput.send([144, channel, 0]);
    }
  });

  if (game.currentState().playedPoint) {
    console.log(
      game.currentState().color +
        " played " +
        game.currentState().playedPoint.y +
        "," +
        game.currentState().playedPoint.x
    );
  }
};

var midiInput = null,
  midiOutput = null,
  grid = new Array(8);

for (var x = 0; x < 8; x++) {
  grid[x] = new Array(8);
}

function midiProc(event) {
  let play = notesToCoordinates(event.data[1]);
  game.playAt(play.y, play.x);
}

/**
      
      Listen for MIDI and initialize

    **/

const onMIDIInit = function(midi) {
  for (var input of midi.inputs.values()) {
    if (input.name === "Launchpad MK2") midiInput = input;
  }

  for (var output of midi.outputs.values()) {
    if (output.name === "Launchpad MK2") midiOutput = output;
  }

  if (midiInput && midiOutput) {
    midiInput.onmidimessage = midiProc;
    midiOutput.send([0xb0, 0x00, 0x00]); // Reset Launchpad
    midiOutput.send([0xb0, 0x00, 0x01]); // Select XY mode
    for (let i = 0; i < 127; i++) {
      midiOutput.send([144, i, 0]);
    }
  }
};

const onMIDIFail = function() {
  console.log("Could not load MIDI");
};

// convert note to x/y coordinates assuming 8x8 grid on Launchpad MK2
const coordinatesToNote = coordinates => {
  value = 88 - 7 + (coordinates.x - coordinates.y * 10);
  return value;
};

const notesToCoordinates = noteNumber => {
  let parse = noteNumber / 10;
  let y = Math.abs(parseInt(parse.toString().split(".")[0]) - 1 - 7);
  let x = parseInt(parse.toString().split(".")[1]) - 1;
  return {
    x: x,
    y: y
  };
};

navigator.requestMIDIAccess({}).then(onMIDIInit, onMIDIFail);

/* Webcam to show Launchpad on screen during presentation
    ========================================================*/
document.getElementById("watch-board").addEventListener("click", function() {
  navigator.mediaDevices
    .getUserMedia({
      audio: false,
      video: {
        width: 1280,
        height: 720
      }
    })
    .then(function(mediaStream) {
      var video = document.querySelector("video");
      video.className = "";
      console.log(video.className);
      video.srcObject = mediaStream;
      video.onloadedmetadata = function(e) {
        video.play();
      };
    })
    .catch(function(err) {
      console.log(err.name + ": " + err.message);
    });
});
