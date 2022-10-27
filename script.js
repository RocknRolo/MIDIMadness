// Author: Roeland L.C. Kemp

const NATURALS = "CDEFGAB";
const SEMITONES = "A BC D EF G ";
const MAJOR_STEPS = [2, 2, 1, 2, 2, 2, 1];

// "A minor" for testing
let scale = new Scale(new Tone('A'),6);

function Tone(natural = 'C', flatSharp = 0, interval = 1, octave = 4) {
    natural = natural.toUpperCase();
    this.natural = (natural >= 'A' && natural <= 'G') ? natural : 'C';
    this.flatSharp = parseInt(flatSharp);
    this.interval = parseInt(interval);
    this.octave = parseInt(octave);

    this.toString = () => {
        let accidentals = "";
        for (let i = 0; i < Math.abs(flatSharp); i++) {
            accidentals += (flatSharp < 0) ? "b" : "#";
        }
        return "" + natural + accidentals;
    }
}

function semitonesBetween(tone1, tone2) {
    let index1 = SEMITONES.indexOf(tone1.natural) + tone1.flatSharp + (tone1.octave * 12);
    let index2 = SEMITONES.indexOf(tone2.natural) + tone2.flatSharp + (tone2.octave * 12);
    return Math.abs(index1 - index2);
}

function Scale(root = new Tone('C'), mode = 1) {
    this.root = root;
    this.mode = (mode % 7 == 0 ? 7 : mode % 7);
    if (mode < 1 || isNaN(mode)) {
        this.mode = 1;
    }
    
    let accidentals;
    let semitoneSteps = 0;

    let tones = [];
    
    for (let i = 1; i <= NATURALS.length; i++) {
        tones.push(calcTone(i, semitoneSteps));
        semitoneSteps += calcWholeHalfPattern()[i - 1];
    }

    this.tones = tones;

    function calcTone(interval, semitoneSteps) {
        let targetNatural = toneAt(NATURALS.indexOf(root.natural) + interval - 1, NATURALS);
        let flatSharpOffset = root.flatSharp;

        if (toneAt(SEMITONES.indexOf(root.natural) + semitoneSteps, SEMITONES) !== targetNatural) {
            for (let i = 1; i < 7; i++) {
                if (toneAt(SEMITONES.indexOf(root.natural) + semitoneSteps - i, SEMITONES) === targetNatural) {
                    flatSharpOffset += i;
                    break;
                } else if (toneAt(SEMITONES.indexOf(root.natural) + semitoneSteps + i, SEMITONES) === targetNatural) {
                    flatSharpOffset -= i;
                    break;
                }
            }
        }
        accidentals += flatSharpOffset;
        return new Tone(targetNatural, flatSharpOffset, interval);
    }

    function calcWholeHalfPattern() {
        let index = mode - 1;
        while (index < 0) {
            index += MAJOR_STEPS.length;
        }
        let pattern = [];
        for (let i = 0; i < MAJOR_STEPS.length; i++) {
            pattern[i] = MAJOR_STEPS[(index + i) % MAJOR_STEPS.length];
        }
        return pattern;
    }

    function toneAt(index, scaleString) {
        while (index < 0) {
            index += scaleString.length;
        }
        return scaleString.charAt(index % scaleString.length);
    }

    this.toString = () => {
        let sclStr = "";
        for (let i = 0; i < tones.length; i++) {
            sclStr += tones[i] + (i !== tones.length - 1 ? " " : "");
        }
        sclStr += " (" + tones[0] + ")";
        return sclStr;
    }
}

function Note(tone, duration) {
    this.tone = tone;
    this.duration = duration;
}

function Pattern(sequence = [1,2,3,4], cadence = [1,2,3,4,5,6,7,8]) {
    this.sequence = sequence;
    this.cadence = cadence;

    let pattern = [];
    for (let i = 0; i < cadence.length; i++) {
        for (let j = 0; j < sequence.length; j++) {
            pattern.push(getScaleTone(sequence[j] + (cadence[i] - 1)));
        }
    }
    return pattern;
}

function getScaleTone(interval) {    
    if (interval == 0 || interval == -1) {
        return scale.tones[0];
    }

    let tone = scale.tones[((interval % scale.tones.length) - 1 + scale.tones.length) % scale.tones.length];
    if (interval > scale.tones.length) {
        let octsUp = (interval - (interval % scale.tones.length)) / scale.tones.length;
        return new Tone(tone.natural, tone.flatSharp, tone.interval, tone.octave + octsUp);
    }
    if (interval < -1) {
        interval++;
        let octsDown = (interval - (interval % scale.tones.length)) / scale.tones.length;
        return new Tone(tone.natural, tone.flatSharp, tone.interval, tone.octave + octsDown);
    }
    return scale.tones[interval - 1];
}


// Unused.
function getReorderedSemitones(startTone) {
    let index = SEMITONES.indexOf(startTone.natural);
    index += startTone.flatSharp;
    while (index < 0) {
        index += SEMITONES.length;
    }
    return SEMITONES.substring(index % SEMITONES.length) + SEMITONES.substring(0, index % SEMITONES.length);
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function calcMIDINumber(tone) {
    return 21 + semitonesBetween(new Tone ('A', 0, 0, 0), tone);
}

function calcFreq(tone) {
    return Math.pow(2, (semitonesBetween(new Tone ('A', 0, 0, 0), tone) - 48) / 12) * 440;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let bpm = 240;

let audioCtx = null;
let osc = null;

let isStarted = false;

const length = bpm / 60 / 32;
const eps = 0.01;

let noteSequence = new Pattern();

function getAudioCtx() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
        osc = audioCtx.createOscillator();
        osc.connect(audioCtx.destination);
        osc.type = 'triangle';
    }
    return audioCtx;
}

function playSequence() {
    getAudioCtx();
    osc.start(0);
    let time = audioCtx.currentTime + eps;
    noteSequence.forEach(tone => {
        let freq = calcFreq(tone);
        osc.frequency.setTargetAtTime(0, time - eps, 0.001);
        osc.frequency.setTargetAtTime(freq, time, 0.001);
        time += length;
    });
    osc.frequency.setTargetAtTime(0, time - eps, 0.001);
}
