// Auteur: Roel Kemp

const NATURALS = "CDEFGAB";
const SEMITONES = "C D EF G A B";
const IONIAN_PATTERN = [2, 2, 1, 2, 2, 2, 1];

function Tone(natural = 'C', flatSharp = 0, interval = 1, octave = 0) {
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
            index += IONIAN_PATTERN.length;
        }
        let pattern = [];
        for (let i = 0; i < IONIAN_PATTERN.length; i++) {
            pattern[i] = IONIAN_PATTERN[(index + i) % IONIAN_PATTERN.length];
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

function getReorderedSemitones(startTone) {
    let index = SEMITONES.indexOf(startTone.natural);
    index += startTone.flatSharp;
    while (index < 0) {
        index += SEMITONES.length;
    }
    return SEMITONES.substring(index % SEMITONES.length) + SEMITONES.substring(0, index % SEMITONES.length);
}

// Deze functie ontvangt 2 Tone objecten en geeft het aantal halve tonen ertussen terug.
// Het eerste Tone object wordt altijd als lager gezien dan het 2de Tone object.
function semitonesBetween(tone1, tone2) {
    let index1 = SEMITONES.indexOf(tone1.natural) + tone1.flatSharp;
    let index2 = SEMITONES.indexOf(tone2.natural) + tone2.flatSharp;
    return (Math.max(index1, index2) - Math.min(index1, index2)) % 12;
}


