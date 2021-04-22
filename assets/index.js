/**
 * Part of this work is forked from https://gist.github.com/pachacamac/d7b3d667ecaa0cd39f36 and modified by julkwel <https://github.com/julkwel>
 */
var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
var colors = ["aqua", "azure", "beige", "bisque", "black", "blue", "brown", "chocolate", "coral", "crimson", "cyan", "fuchsia", "ghostwhite", "gold", "goldenrod", "gray", "green", "indigo", "ivory", "khaki", "lavender", "lime", "linen", "magenta", "maroon", "moccasin", "navy", "olive", "orange", "orchid", "peru", "pink", "plum", "purple", "red", "salmon", "sienna", "silver", "snow", "tan", "teal", "thistle", "tomato", "turquoise", "violet", "white", "yellow"];
var grammar = '#JSGF V1.0; grammar colors; public <color> = ' + colors.join(' | ') + ' ;';
var recognition = new SpeechRecognition();
var speechRecognitionList = new SpeechGrammarList();

speechRecognitionList.addFromString(grammar, 1);
recognition.grammars = speechRecognitionList;
recognition.continuous = false;
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

/**
 * Recording a voice
 *
 * @param cb
 * @constructor
 */
const Recording = function (cb) {
    let recorder = null;
    let recording = true;
    let audioInput = null;
    let volume = null;
    let audioContext = null;
    let callback = cb;

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    if (navigator.getUserMedia) {
        navigator.getUserMedia(
            {audio: true},
            function (e) { //success
                let AudioContext = window.AudioContext || window.webkitAudioContext;
                audioContext = new AudioContext();
                volume = audioContext.createGain(); // creates a gain node
                audioInput = audioContext.createMediaStreamSource(e); // creates an audio node from the mic stream
                audioInput.connect(volume);// connect the stream to the gain node
                recorder = audioContext.createScriptProcessor(2048, 1, 1);

                recorder.addEventListener('audioprocess', function (e) {
                    if (!recording) return;
                    let left = e.inputBuffer.getChannelData(0);
                    //var right = e.inputBuffer.getChannelData(1);
                    // console.log(left)
                    callback(new Float32Array(left));
                });

                volume.connect(recorder);// connect the recorder
                recorder.connect(audioContext.destination);
            },

            function (e) { //failure
                Swal.fire('Oopppss ...', 'Error capturing audio.', 'error');
            }
        );
    } else {
        alert('getUserMedia not supported in this browser.');
    }
};

let lastClap = (new Date()).getTime();

function detectClap(data) {
    let t = (new Date()).getTime();
    if (t - lastClap < 200) return false; // TWEAK HERE
    let zeroCrossings = 0, highAmp = 0;
    for (let i = 1; i < data.length; i++) {
        if (Math.abs(data[i]) > 0.25) highAmp++; // TWEAK HERE
        if (data[i] > 0 && data[i - 1] < 0 || data[i] < 0 && data[i - 1] > 0) zeroCrossings++;
    }
    if (highAmp > 20 && zeroCrossings > 30) { // TWEAK HERE
        //console.log(highAmp+' / '+zeroCrossings);
        lastClap = t;
        return true;
    }
    return false;
}

const changeBg = function (container) {
    $(container).css('background', colors[Math.floor(Math.random() * colors.length)])
};

new Recording(function (data) {
    if (detectClap(data) && !$('.choose-color').hasClass('speech')) {
        changeBg('.clap-change-bg');
    }
});

recognition.onresult = function (event) {
    let color = event.results[0][0].transcript;
    color = color.toLowerCase();

    if (colors.includes(color)) {
        Swal.fire('Yesss !', color + ' choosen !', 'success').then(() => {
            $('.clap-change-bg').css('background', color);
            switchToSong();
        });
    }
};

recognition.onnomatch = function (event) {
    console.log('nomatch' + event.error);
    reboot();
};

recognition.onerror = function (event) {
    console.log('error' + event.error);
    reboot();
};

recognition.onspeechend = function (event) {
    reboot();
};

const reboot = function () {
    recognition.stop();

    setTimeout(function () {
        recognition.start();
    }, 1000);
};

const colorButton = $('.choose-color');
let speechList = $('.alert-speech');
let colorList = $('.color-list');

const switchToSong = function () {
    colorButton.removeClass('speech');
    colorButton.text('Color speech !');
    colorList.text('');
    speechList.addClass('d-none');

    recognition.stop();
};

const switchToSpeel = function () {
    colorButton.addClass('speech');
    colorButton.text('Switch to song !');
    speechList.removeClass('d-none');
    colorList.text(colors.join(','));

    recognition.start();
};

$(function () {
    $(document).on('click', '.choose-color', function () {
        if ($(this).hasClass('speech')) {
            switchToSong();
        } else {
            switchToSpeel();
        }
    })
});
