/**
 * This work is forked from https://gist.github.com/pachacamac/d7b3d667ecaa0cd39f36 and modified by julkwel <https://github.com/julkwel>
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
        navigator.getUserMedia({audio: true},
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
                alert('Error capturing audio.');
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
    if ($(container).hasClass('bg-light')) {
        $(container).removeClass('bg-light').addClass('bg-dark');
    } else {
        $(container).removeClass('bg-dark').addClass('bg-light');
    }
};

new Recording(function (data) {
    if (detectClap(data)) {
        changeBg('.clap-change-bg');
    }
});
