class VolumeDetection {
    constructor() {
        this.mediaStreamSource = null;
        this.audioContext = null;
        this.meter = null;
    }

    init() {
        this.startAudioContext();
    }

    startAudioContext() {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;

        this.audioContext = new AudioContext();

        // try {
        //   navigator.getUserMedia =
        //     navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

        //   navigator.getUserMedia(
        //     {
        //       audio: {
        //         mandatory: {
        //           googEchoCancellation: "false",
        //           googAutoGainControl: "false",
        //           googNoiseSuppression: "false",
        //           googHighpassFilter: "false"
        //         },
        //         optional: []
        //       }
        //     },
        //     this.gotStream.bind(this),
        //     this.didntGetStream.bind(this)
        //   );
        // } catch (e) {
        //   alert("getUserMedia `threw exception :" + e);
        // }
        var constraints = {
            audio: true,
            video: false
        };

        navigator.mediaDevices
            .getUserMedia(constraints)
            .then(this.gotStream.bind(this))
            .catch(this.didntGetStream.bind(this));
    }

    didntGetStream() {
        alert("Stream generation failed.");
    }

    gotStream(stream) {
        console.log("là");

        this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);

        this.meter = this.createAudioMeter(this.audioContext);
        this.mediaStreamSource.connect(this.meter);
    }

    createAudioMeter(audioContext, clipLevel, averaging, clipLag) {
        var processor = audioContext.createScriptProcessor(512);
        processor.onaudioprocess = this.volumeAudioProcess;
        processor.clipping = false;
        processor.lastClip = 0;
        processor.volume = 0;
        processor.clipLevel = clipLevel || 0.98;
        processor.averaging = averaging || 0.95;
        processor.clipLag = clipLag || 750;

        // this will have no effect, since we don't copy the input to the output,
        // but works around a current Chrome bug.
        processor.connect(audioContext.destination);

        processor.checkClipping = function() {
            if (!this.clipping) return false;
            if (this.lastClip + this.clipLag < window.performance.now()) this.clipping = false;
            return this.clipping;
        };

        processor.shutdown = function() {
            this.disconnect();
            this.onaudioprocess = null;
        };

        return processor;
    }

    volumeAudioProcess(event) {
        var buf = event.inputBuffer.getChannelData(0);
        var bufLength = buf.length;
        var sum = 0;
        var x;

        // Do a root-mean-square on the samples: sum up the squares...
        for (var i = 0; i < bufLength; i++) {
            x = buf[i];
            if (Math.abs(x) >= this.clipLevel) {
                this.clipping = true;
                this.lastClip = window.performance.now();
            }
            sum += x * x;
        }

        // ... then take the square root of the sum.
        var rms = Math.sqrt(sum / bufLength);

        // Now smooth this out with the averaging factor applied
        // to the previous sample - take the max here because we
        // want "fast attack, slow release."
        this.volume = Math.max(rms, this.volume * this.averaging);
    }
}

export default new VolumeDetection();