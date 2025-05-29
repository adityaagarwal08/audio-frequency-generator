class BinauralBeatGenerator {
    constructor() {
        this.audioContext = null;
        this.leftOscillator = null;
        this.rightOscillator = null;
        this.gainNode = null;
        this.merger = null;
        this.isPlaying = false;
        this.isPaused = false;
        this.baseFrequency = 300; // Fixed 300Hz base frequency
        this.beatFrequency = 0;
        this.volume = 0.5;

        this.initializeElements();
        this.setupEventListeners();
        this.checkBrowserSupport();
    }

    initializeElements() {
        // Control elements
        this.beatFrequencySlider = document.getElementById('beatFrequency');
        this.volumeSlider = document.getElementById('volume');
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');

        // Display elements
        this.rightFreqDisplay = document.getElementById('rightFreqDisplay');
        this.beatFreqDisplay = document.getElementById('beatFreqDisplay');
        this.beatTypeDisplay = document.getElementById('beatTypeDisplay');
        this.statusDisplay = document.getElementById('statusDisplay');
        this.browserWarning = document.getElementById('browserWarning');
    }

    checkBrowserSupport() {
        if (!window.AudioContext && !window.webkitAudioContext) {
            this.browserWarning.classList.remove('d-none');
            this.disableControls();
            return false;
        }
        
        // Enable controls if browser supports Web Audio API
        this.playBtn.disabled = false;
        return true;
    }

    disableControls() {
        this.playBtn.disabled = true;
        this.pauseBtn.disabled = true;
        this.stopBtn.disabled = true;
        this.beatFrequencySlider.disabled = true;
        this.volumeSlider.disabled = true;
    }

    setupEventListeners() {
        // Beat frequency slider
        this.beatFrequencySlider.addEventListener('input', (e) => {
            this.beatFrequency = parseFloat(e.target.value);
            this.updateFrequencyDisplays();
            if (this.isPlaying) {
                this.updateOscillatorFrequencies();
            }
        });

        // Volume slider
        this.volumeSlider.addEventListener('input', (e) => {
            this.volume = parseFloat(e.target.value);
            if (this.gainNode) {
                this.gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
            }
        });

        // Playback controls
        this.playBtn.addEventListener('click', () => this.play());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.stopBtn.addEventListener('click', () => this.stop());
    }

    updateFrequencyDisplays() {
        const rightFreq = this.baseFrequency + this.beatFrequency;
        this.rightFreqDisplay.textContent = `${rightFreq.toFixed(1)} Hz`;
        this.beatFreqDisplay.textContent = `${this.beatFrequency.toFixed(1)} Hz`;
        
        // Update beat type description
        this.beatTypeDisplay.textContent = this.getBeatTypeDescription(this.beatFrequency);
    }

    getBeatTypeDescription(frequency) {
        if (frequency === 0) return 'No Beat';
        if (frequency <= 4) return 'Delta - Deep Sleep';
        if (frequency <= 8) return 'Theta - Meditation';
        if (frequency <= 13) return 'Alpha - Relaxation';
        if (frequency <= 30) return 'Beta - Focus';
        return 'Gamma - High Cognition';
    }

    async initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain node for volume control
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);

            // Create channel merger for stereo output
            this.merger = this.audioContext.createChannelMerger(2);
            
            // Connect gain to merger to destination
            this.merger.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);

            return true;
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
            this.updateStatus('Audio initialization failed', 'danger');
            return false;
        }
    }

    createOscillators() {
        try {
            // Left oscillator (300Hz fixed)
            this.leftOscillator = this.audioContext.createOscillator();
            this.leftOscillator.type = 'sine';
            this.leftOscillator.frequency.setValueAtTime(this.baseFrequency, this.audioContext.currentTime);
            this.leftOscillator.connect(this.merger, 0, 0); // Connect to left channel

            // Right oscillator (300Hz + beat frequency)
            this.rightOscillator = this.audioContext.createOscillator();
            this.rightOscillator.type = 'sine';
            this.rightOscillator.frequency.setValueAtTime(
                this.baseFrequency + this.beatFrequency, 
                this.audioContext.currentTime
            );
            this.rightOscillator.connect(this.merger, 0, 1); // Connect to right channel

            return true;
        } catch (error) {
            console.error('Failed to create oscillators:', error);
            this.updateStatus('Oscillator creation failed', 'danger');
            return false;
        }
    }

    updateOscillatorFrequencies() {
        if (this.leftOscillator && this.rightOscillator) {
            try {
                const rightFreq = this.baseFrequency + this.beatFrequency;
                this.rightOscillator.frequency.setValueAtTime(rightFreq, this.audioContext.currentTime);
            } catch (error) {
                console.error('Failed to update frequencies:', error);
            }
        }
    }

    async play() {
        try {
            if (this.isPaused) {
                // Resume from pause
                await this.audioContext.resume();
                this.isPaused = false;
                this.updateStatus('Playing', 'success');
                this.updateControlStates();
                return;
            }

            // Initialize audio context if needed
            if (!this.audioContext) {
                const initialized = await this.initializeAudioContext();
                if (!initialized) return;
            }

            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Create and start oscillators
            if (!this.createOscillators()) return;

            this.leftOscillator.start();
            this.rightOscillator.start();

            this.isPlaying = true;
            this.isPaused = false;
            this.updateStatus('Playing', 'success');
            this.updateControlStates();

        } catch (error) {
            console.error('Playback failed:', error);
            this.updateStatus('Playback failed', 'danger');
        }
    }

    pause() {
        if (this.audioContext && this.isPlaying && !this.isPaused) {
            this.audioContext.suspend();
            this.isPaused = true;
            this.updateStatus('Paused', 'warning');
            this.updateControlStates();
        }
    }

    stop() {
        try {
            if (this.leftOscillator) {
                this.leftOscillator.stop();
                this.leftOscillator.disconnect();
                this.leftOscillator = null;
            }

            if (this.rightOscillator) {
                this.rightOscillator.stop();
                this.rightOscillator.disconnect();
                this.rightOscillator = null;
            }

            this.isPlaying = false;
            this.isPaused = false;
            this.updateStatus('Stopped', 'secondary');
            this.updateControlStates();

        } catch (error) {
            console.error('Stop failed:', error);
            this.updateStatus('Stop failed', 'danger');
        }
    }

    updateControlStates() {
        if (this.isPlaying && !this.isPaused) {
            this.playBtn.disabled = true;
            this.pauseBtn.disabled = false;
            this.stopBtn.disabled = false;
        } else if (this.isPaused) {
            this.playBtn.disabled = false;
            this.pauseBtn.disabled = true;
            this.stopBtn.disabled = false;
        } else {
            this.playBtn.disabled = false;
            this.pauseBtn.disabled = true;
            this.stopBtn.disabled = true;
        }
    }

    updateStatus(message, type = 'secondary') {
        this.statusDisplay.textContent = message;
        this.statusDisplay.className = `badge bg-${type} fs-6`;
    }
}

// Initialize the binaural beat generator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.binauralGenerator = new BinauralBeatGenerator();
});

// Handle page visibility changes to pause/resume audio
document.addEventListener('visibilitychange', () => {
    if (window.binauralGenerator) {
        if (document.hidden && window.binauralGenerator.isPlaying && !window.binauralGenerator.isPaused) {
            window.binauralGenerator.pause();
        }
    }
});
