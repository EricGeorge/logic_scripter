/** This script is based off of the Reason Studios Scales and Chords Player.  The settings provide the same outputs
 * as the similar settings on the Reason Player
 */

// Chordtypes
const chord = {}

// intervals
chord.unison = [0]
chord.fifth = [7];

// 3 note chords
chord.maj = [4, 7];
chord.min = [3, 7];
chord.dim = [3, 6];     // not used in Reason Player - min_sharp5 is substituted...
chord.min_sharp5 = [3, 8];

// 4 notes chords
chord.maj7 = [4, 7, 11];
chord.min7 = [3, 7, 10];
chord.dom7 = [4, 7, 10];
chord.dim7 = [3, 6, 10];    // not used in Reason Player - min_sharp5 is substituted...
chord.min7_Sharp5 = [3, 8, 10]

// 5 note chords
chord.maj9 = [4, 7, 11, 14]
chord.min9 = [3, 7, 10, 14]
chord.min7b9 = [3, 7, 10, 13]
chord.dom9 = [4, 7, 10, 14]
chord.min7_Sharp5_b9 = [3, 8, 10, 13]

var major3Notes = [chord.maj, 0, chord.min, 0, chord.min, chord.maj, 0, chord.maj, 0, chord.min, 0, chord.min_sharp5];
var minor3Notes = [chord.min, 0, chord.min_sharp5, chord.maj, 0, chord.min, 0, chord.min, chord.maj, 0, chord.maj]
var major4Notes = [chord.maj7, 0, chord.min7, 0, chord.min7, chord.maj7, 0, chord.dom7, 0, chord.min7, 0, chord.min7_Sharp5];
var minor4Notes = [chord.min7, 0, chord.min7_Sharp5, chord.maj7, 0, chord.min7, 0, chord.min7, chord.maj7, 0, chord.dom7]
var major5Notes = [chord.maj9, 0, chord.min9, 0, chord.min7b9, chord.maj9, 0, chord.dom9, 0, chord.min9, 0, chord.min7_Sharp5_b9];
var minor5Notes = [chord.min9, 0, chord.min7_Sharp5_b9, chord.maj9, 0, chord.min9, 0, chord.min7b9, chord.maj9, 0, chord.dom9]

// supported scales - add more here
const scale = {}

scale.maj = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1];
scale.min = [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0];

var activeNotes = [];
var scalekey = 0;

function arrayRotate(arr, reverse) {
    if (reverse) arr.unshift(arr.pop());
    else arr.push(arr.shift());
    return arr;
  }

function initMidiNotes() {

    midinotes = [];
    var currentScale = [];

    // copy the scales into currentScale so I don't get any reference nonsense
    if (GetParameter("Mode") == 0) {
        currentScale = [...scale.maj];
    } else {
        currentScale = [...scale.min];
    }

    for (var x = 0; x < scalekey; x++) {
        // rotate scale for current key
        currentScale.unshift(currentScale.pop());
    }

    // build up the entire midi range to current mode/key
    for (var x = 0; x < 144; x += 12) {
        for (var y = 0; y < 12; y++) {
            if (0 == currentScale[y]) {
                midinotes.push(-1);
            }
            else {
                midinotes.push(x + y);
            }
        }
    }
}

// Correct upwards for midi notes out of scale
function initMidiNotesUp() {

    initMidiNotes();

    x = 1;
    while (x < midinotes.length) {
        if (-1 == midinotes[x]) {
            midinotes[x] = midinotes[x - 1];
        }
        x++;
    }
}

function quantizeMidi(event) {
    event.pitch = midinotes[event.pitch];
}

function ParameterChanged(param, value) {
    switch (param) {
        case 1:
            scalekey = value;
            initMidiNotesUp();
            break;
        case 2:
            initMidiNotesUp();
            break;
    }
}

function HandleMIDI(event) {

    var numNotes = GetParameter("Number of Notes in Chord");
    var mode = GetParameter("Mode");

    quantizeMidi(event);

    chordIndex = (event.pitch - GetParameter("Scale Key")) % 12
    // 1 note
    if (numNotes == 0) {
        // unison
        buildChord(event, chord.unison);
    }
    // 2 notes
    if (numNotes == 1) {
        // root + 5th
        buildChord(event, chord.fifth);
    }
    // 3 notes
    if (numNotes == 2) {
        if (mode == 0) {
            buildChord(event, major3Notes[chordIndex])
         }
        else if (mode == 1) {
            buildChord(event, minor3Notes[chordIndex])
        }
    }
    // 4 notes
    if (numNotes == 3) {
        if (mode == 0) {
            buildChord(event, major4Notes[chordIndex])
         }
        else if (mode == 1) {
            buildChord(event, minor4Notes[chordIndex])
        }
    }
    // 5 notes
    if (numNotes == 4) {
        if (mode == 0) {
            buildChord(event, major5Notes[chordIndex])
         }
        else if (mode == 1) {
            buildChord(event, minor5Notes[chordIndex])
        }
    }
}

function buildChord(root, chordtype) {
    // play root note
    if (root instanceof NoteOn) {
        var originalNote = new NoteOn(root);
        var record = {
            originalPitch: root.pitch,
            events: [originalNote]
        };
        root.send();
        // play rest of chord notes
        for (var i = 0; i < chordtype.length; i++) {
            var harmony = new NoteOn(root);
            harmony.pitch += chordtype[i];

            if (GetParameter("Open Chord") == 1) {
                // for 3 note and 4 note chords, move the 3rd up an octave
                if (i == 0) {
                    harmony.pitch += 12;
                }
                if ((chordtype.length > 3) && (i > 1)) {
                    harmony.pitch += 12;
                }
            }
            record.events.push(harmony);
            harmony.send();    
        }
        // play Color note
        if (GetParameter("Add Color") == 1) {
            var harmony = new NoteOn(root);
            
            // Treat the sharp5 chord a bit different to match Reason
            var colorNoteOffset = 7;
            
            harmony.pitch += chordtype[chordtype.length - 1] + colorNoteOffset;

            // re-quantize to keep it in key
            quantizeMidi(harmony);

            record.events.push(harmony);
            harmony.send();  
        }
        // play root note up an octave
        if (GetParameter("Add Root Up 1 Octave") == 1) {
            var harmony = new NoteOn(root);
            harmony.pitch += 12
            record.events.push(harmony);
            harmony.send();  
        }
        // play root note down an octave
        if (GetParameter("Add Root Down 1 Octave") == 1) {
            var harmony = new NoteOn(root);
            harmony.pitch -= 12
            record.events.push(harmony);
            harmony.send();  
        }
        activeNotes.push(record);
    } else if (root instanceof NoteOff) {
        for (var i in activeNotes) {
            if (activeNotes[i].originalPitch == root.pitch) {
                for (var j = 0; j < activeNotes[i].events.length; j++) {
                    var noteOff = new NoteOff(activeNotes[i].events[j]);
                    noteOff.send();
                }
                activeNotes.splice(i, 1);
                break;
            }
        }
    }
}

ResetParameterDefaults = true;

var PluginParameters = [{
    name: "Chords",
    type: "text"
}, {
    name: "Scale Key",
    type: "menu",
    valueStrings: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
    defaultValue: 0,
    minValue: 0,
    maxValue: 11,
    numberOfSteps: 12
}, {
    name: "Mode",
    type: "menu",
    valueStrings: ["Major", "Minor"],
    defaultValue: 0,
    minValue: 0,
    maxValue: 1,
    numberOfSteps: 2
}, {
    name: "Number of Notes in Chord",
    type: "menu",
    valueStrings: ["1", "2", "3", "4", "5"],
    defaultValue: 2,
    minValue: 0,
    maxValue: 4,
    numberOfSteps: 5
},
{
    name: "Add Color",
    type: "checkbox",
    defaultValue: 0,
},
{
    name: "Add Root Up 1 Octave",
    type: "checkbox",
    defaultValue: 0,
},
{
    name: "Add Root Down 1 Octave",
    type: "checkbox",
    defaultValue: 0,
},
{
    name: "Open Chord",
    type: "checkbox",
    defaultValue: 0,
}];
