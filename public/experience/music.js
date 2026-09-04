// Replaces the template's adaptive three-stem score with one continuous track.
// The AudioManager still owns the UI state and all one-shot sound effects.
(function () {
    var TRACK_URL = '/interstellar.m4a';
    var FADE_MS = 600;
    var track = new Audio(TRACK_URL);
    var fadeFrame = 0;
    var connected = false;

    track.loop = true;
    track.preload = 'auto';
    track.volume = 0;

    function fadeTo(volume, pauseAtEnd) {
        cancelAnimationFrame(fadeFrame);
        var from = track.volume;
        var startedAt = performance.now();

        function step(now) {
            var progress = Math.min(1, (now - startedAt) / FADE_MS);
            var eased = progress * progress * (3 - 2 * progress);
            track.volume = from + (volume - from) * eased;
            if (progress < 1) {
                fadeFrame = requestAnimationFrame(step);
            } else if (pauseAtEnd) {
                track.pause();
            }
        }

        fadeFrame = requestAnimationFrame(step);
    }

    function setPlaying(playing, targetVolume) {
        if (playing) {
            var result = track.play();
            if (result) result.catch(function () { /* waits for the next user gesture */ });
            fadeTo(targetVolume, false);
        } else {
            fadeTo(0, true);
        }
    }

    function connect() {
        if (connected) return;

        var app = pc.Application.getApplication();
        var managers = app && app.root.findByName('Managers');
        var audio = managers && managers.script && managers.script.audioManager;
        if (!audio || !window.EventBus) {
            requestAnimationFrame(connect);
            return;
        }

        // Stop any template score that may already have started, then clear its
        // sources so later play/toggle calls only affect the replacement track.
        if (audio._stemsPlaying) audio._stopStems();
        audio._stems = null;
        audio.stemMelody = null;
        audio.stemBass = null;
        audio.stemInstruments = null;

        var targetVolume = Math.min(1, audio.stemVolume * audio.masterVolume);
        EventBus.on('audio:musicState', function (state) {
            setPlaying(Boolean(state && state.playing), targetVolume);
        });
        EventBus.on('experience:restart', function () {
            track.pause();
            track.currentTime = 0;
            track.volume = 0;
        });

        connected = true;
    }

    connect();
})();
