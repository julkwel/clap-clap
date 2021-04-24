/**
 * By julkwel <https://github.com/julkwel>
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
 * This function is a forked from https://gist.github.com/pachacamac/d7b3d667ecaa0cd39f36 and modified by me
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
    console.log('aaaa');
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
const speechList = $('.alert-speech');
const colorList = $('.color-list');

const switchToSong = function () {
    onNotSpeech();
    recognition.stop();
};

const onNotSpeech = function () {
    speechList.addClass('d-none');
    colorList.addClass('d-none');
    colorButton.removeClass('speech');
};

const onSpeech = function () {
    colorButton.addClass('speech');
    speechList.removeClass('d-none');
    colorList.removeClass('d-none').text(colors.join(','));
};

const switchToSpeel = function () {
    onSpeech();

    recognition.start();
};

const toggleFullscreen = (close) => {
    let element = document.documentElement;
    let isFullscreen = document.webkitIsFullScreen || document.mozFullScreen || false;

    element.requestFullScreen = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || function () {
        return false;
    };

    document.cancelFullScreen = document.cancelFullScreen || document.webkitCancelFullScreen || document.mozCancelFullScreen || function () {
        return false;
    };

    if (close) {
        document.cancelFullScreen();

        return;
    }

    isFullscreen ? document.cancelFullScreen() : element.requestFullScreen();
};

// add your music in music directory, then put your title here,
const musics = [
    '2002',
    'door-open'
];

let audioElement = new Audio('./assets/music/' + musics[Math.floor(Math.random() * musics.length)] + '.mp3');
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
const track = audioContext.createMediaElementSource(audioElement);

// connect the track
track.connect(audioContext.destination);

const playButton = document.querySelector('button.play-music');
playButton.addEventListener('click', function () {
    onNotSpeech();
    audioPlayer();
}, false);

audioPlayer = function (event) {
    if ('pause' === event) {
        audioElement.pause();
        return;
    }

    // launch audio
    audioElement.play().then();
    // toggleFullscreen();

    // check if context is in suspended state (autoplay policy)
    if (audioContext.state === 'suspended') {
        audioContext.resume().then();
        $('button.play-music').text('Pause song !');
        toggleFullscreen();
    }

    if (audioContext.state === 'running') {
        $('button.play-music').text('Resume song !');
        audioContext.suspend().then();
        toggleFullscreen();
    }
};

$(function () {
    $(document).on('click', '.choose-color', function () {
        audioPlayer('pause');
        switchToSpeel();
        toggleFullscreen(true);
    });

    $(document).on('click', '.clap-clap', function () {
        audioPlayer('pause');
        switchToSong();
        toggleFullscreen(true);
    })
});
