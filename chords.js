/** This script is based off of the Reason Studios Scales and Chords Player.  The settings provide the same outputs
 * as the similar settings on the Reason Player
 */

/** TODO:
 *  - Choose color note properly
 *  - Add open chord option
 *  - Rename parameters better
 *  - Add chord inversions
 *  - Add scale quantization
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

// factor this down to 7 notes once I have scale quantization
var major3Notes = [chord.maj, 0, chord.min, 0, chord.min, chord.maj, 0, chord.maj, 0, chord.min, 0, chord.min_sharp5];
var minor3Notes = [chord.min, 0, chord.min_sharp5, chord.maj, 0, chord.min, 0, chord.min, chord.maj, 0, chord.maj]
var major4Notes = [chord.maj7, 0, chord.min7, 0, chord.min7, chord.maj7, 0, chord.dom7, 0, chord.min7, 0, chord.min7_Sharp5];
var minor4Notes = [chord.min7, 0, chord.min7_Sharp5, chord.maj7, 0, chord.min7, 0, chord.min7, chord.maj7, 0, chord.dom7]
var major5Notes = [chord.maj9, 0, chord.min9, 0, chord.min7b9, chord.maj9, 0, chord.dom9, 0, chord.min9, 0, chord.min7_Sharp5_b9];
var minor5Notes = [chord.min9, 0, chord.min7_Sharp5_b9, chord.maj9, 0, chord.min9, 0, chord.min7b9, chord.maj9, 0, chord.dom9]

var activeNotes = [];

function HandleMIDI(event) {

    chordIndex = (event.pitch - GetParameter("Root")) % 12
    // 1 note
    if (GetParameter("NoteCount") == 0) {
        // unison
        buildChord(event, unison);
    }
    // 2 notes
    if (GetParameter("NoteCount") == 1) {
        // root + 5th
        buildChord(event, fifth);
    }
    // 3 notes
    if (GetParameter("NoteCount") == 2) {
        if (GetParameter("Mode") == 0) {
            buildChord(event, major3Notes[chordIndex])
            event.trace()
         }
        else if (GetParameter("Mode") == 1) {
            buildChord(event, minor3Notes[chordIndex])
            event.trace()
        }
    }
    // 4 notes
    if (GetParameter("NoteCount") == 3) {
        if (GetParameter("Mode") == 0) {
            buildChord(event, major4Notes[chordIndex])
         }
        else if (GetParameter("Mode") == 1) {
            buildChord(event, minor4Notes[chordIndex])
        }
    }
    // 5 notes
    if (GetParameter("NoteCount") == 4) {
        if (GetParameter("Mode") == 0) {
            buildChord(event, major5Notes[chordIndex])
         }
        else if (GetParameter("Mode") == 1) {
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
            record.events.push(harmony);
            harmony.send();
        }
        // play color note
        if (GetParameter("Color") == 1) {
            var harmony = new NoteOn(root);
            harmony.pitch += chordtype[chordtype.length - 1] + 7
            record.events.push(harmony);
            harmony.send();  
        }
        // play root note up an octave
        if (GetParameter("UpOctave") == 1) {
            var harmony = new NoteOn(root);
            harmony.pitch += 12
            record.events.push(harmony);
            harmony.send();  
        }
        // play root note down an octave
        if (GetParameter("DownOctave") == 1) {
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
    name: "Root",
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
    name: "NoteCount",
    type: "menu",
    valueStrings: ["1", "2", "3", "4", "5"],
    defaultValue: 2,
    minValue: 0,
    maxValue: 4,
    numberOfSteps: 5
},
{
    name: "Color",
    type: "checkbox",
    defaultValue: 0,
},
{
    name: "UpOctave",
    type: "checkbox",
    defaultValue: 0,
},
{
    name: "DownOctave",
    type: "checkbox",
    defaultValue: 0,
}];
