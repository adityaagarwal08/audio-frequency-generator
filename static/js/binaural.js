class BinauralBeatGenerator {
    constructor() {
        this.audioContext = null;
        this.leftOscillator = null;
        this.rightOscillator = null;
        this.monoOscillator = null;
        this.binauralGainNode = null;
        this.musicGainNode = null;
        this.musicSource = null;
        this.musicBuffer = null;
        this.merger = null;
        this.masterGain = null;
        this.isPlaying = false;
        this.isPaused = false;
        this.mode = 'binaural'; // 'binaural' or 'mono'
        this.baseFrequency = 300; // Fixed 300Hz base frequency
        this.beatFrequency = 0;
        this.monoFrequency = 440; // Default A4 frequency
        this.binauralVolume = 0.5;
        this.musicVolume = 0.3;
        this.hasMusicFile = false;

        this.initializeElements();
        this.setupEventListeners();
        this.checkBrowserSupport();
    }

    initializeElements() {
        // Control elements
        this.beatFrequencySlider = document.getElementById('beatFrequency');
        this.monoFrequencySlider = document.getElementById('monoFrequency');
        this.beatFreqInput = document.getElementById('beatFreqInput');
        this.monoFreqInput = document.getElementById('monoFreqInput');
        this.setBeatFreqBtn = document.getElementById('setBeatFreq');
        this.setMonoFreqBtn = document.getElementById('setMonoFreq');
        this.binauralVolumeSlider = document.getElementById('binauralVolume');
        this.musicVolumeSlider = document.getElementById('musicVolume');
        this.musicFileInput = document.getElementById('musicFile');
        this.clearMusicBtn = document.getElementById('clearMusic');
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');

        // Mode selection
        this.binauralModeBtn = document.getElementById('binauralMode');
        this.monoModeBtn = document.getElementById('monoMode');

        // Display elements
        this.rightFreqDisplay = document.getElementById('rightFreqDisplay');
        this.beatFreqDisplay = document.getElementById('beatFreqDisplay');
        this.beatTypeDisplay = document.getElementById('beatTypeDisplay');
        this.monoFreqDisplay = document.getElementById('monoFreqDisplay');
        this.statusDisplay = document.getElementById('statusDisplay');
        this.browserWarning = document.getElementById('browserWarning');
        this.musicStatus = document.getElementById('musicStatus');
        this.musicVolumeControl = document.getElementById('musicVolumeControl');

        // Sections
        this.beatFreqSection = document.getElementById('beatFreqSection');
        this.monoFreqSection = document.getElementById('monoFreqSection');
        this.beatFreqControl = document.getElementById('beatFreqControl');
        this.monoFreqControl = document.getElementById('monoFreqControl');
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
        this.binauralVolumeSlider.disabled = true;
        this.musicVolumeSlider.disabled = true;
        this.musicFileInput.disabled = true;
    }

    setupEventListeners() {
        // Mode selection
        this.binauralModeBtn.addEventListener('change', () => this.switchMode('binaural'));
        this.monoModeBtn.addEventListener('change', () => this.switchMode('mono'));

        // Beat frequency slider
        this.beatFrequencySlider.addEventListener('input', (e) => {
            this.beatFrequency = parseFloat(e.target.value);
            this.beatFreqInput.value = this.beatFrequency.toFixed(1);
            this.updateFrequencyDisplays();
            if (this.isPlaying && this.mode === 'binaural') {
                this.updateOscillatorFrequencies();
            }
        });

        // Mono frequency slider
        this.monoFrequencySlider.addEventListener('input', (e) => {
            this.monoFrequency = parseFloat(e.target.value);
            this.monoFreqInput.value = this.monoFrequency;
            this.updateFrequencyDisplays();
            if (this.isPlaying && this.mode === 'mono') {
                this.updateOscillatorFrequencies();
            }
        });

        // Beat frequency input and set button
        this.setBeatFreqBtn.addEventListener('click', () => {
            const value = parseFloat(this.beatFreqInput.value);
            if (!isNaN(value) && value >= 0 && value <= 50) {
                this.beatFrequency = value;
                this.beatFrequencySlider.value = value;
                this.updateFrequencyDisplays();
                if (this.isPlaying && this.mode === 'binaural') {
                    this.updateOscillatorFrequencies();
                }
            } else {
                alert('Please enter a valid frequency between 0 and 50 Hz');
                this.beatFreqInput.value = this.beatFrequency.toFixed(1);
            }
        });

        // Allow Enter key to set beat frequency
        this.beatFreqInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.setBeatFreqBtn.click();
            }
        });

        // Mono frequency input and set button
        this.setMonoFreqBtn.addEventListener('click', () => {
            const value = parseFloat(this.monoFreqInput.value);
            if (!isNaN(value) && value >= 20 && value <= 20000) {
                this.monoFrequency = value;
                this.monoFrequencySlider.value = value;
                this.updateFrequencyDisplays();
                if (this.isPlaying && this.mode === 'mono') {
                    this.updateOscillatorFrequencies();
                }
            } else {
                alert('Please enter a valid frequency between 20 and 20000 Hz');
                this.monoFreqInput.value = this.monoFrequency;
            }
        });

        // Allow Enter key to set mono frequency
        this.monoFreqInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.setMonoFreqBtn.click();
            }
        });

        // Preset frequency buttons
        document.querySelectorAll('[data-freq]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const freq = parseInt(e.target.dataset.freq);
                this.monoFrequency = freq;
                this.monoFrequencySlider.value = freq;
                this.monoFreqInput.value = freq;
                this.updateFrequencyDisplays();
                if (this.isPlaying && this.mode === 'mono') {
                    this.updateOscillatorFrequencies();
                }
            });
        });

        // Binaural volume slider
        this.binauralVolumeSlider.addEventListener('input', (e) => {
            this.binauralVolume = parseFloat(e.target.value);
            if (this.binauralGainNode) {
                this.binauralGainNode.gain.setValueAtTime(this.binauralVolume, this.audioContext.currentTime);
            }
        });

        // Music volume slider
        this.musicVolumeSlider.addEventListener('input', (e) => {
            this.musicVolume = parseFloat(e.target.value);
            if (this.musicGainNode) {
                this.musicGainNode.gain.setValueAtTime(this.musicVolume, this.audioContext.currentTime);
            }
        });

        // Music file input
        this.musicFileInput.addEventListener('change', (e) => this.handleMusicFile(e));

        // Clear music button
        this.clearMusicBtn.addEventListener('click', () => this.clearMusic());

        // Playback controls
        this.playBtn.addEventListener('click', () => this.play());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.stopBtn.addEventListener('click', () => this.stop());
    }

    switchMode(mode) {
        this.mode = mode;
        
        // Update volume label based on mode
        const volumeLabel = this.binauralVolumeSlider.parentElement.querySelector('label');
        const volumeIcon = volumeLabel.querySelector('i');
        
        if (mode === 'binaural') {
            this.beatFreqSection.style.display = 'block';
            this.monoFreqSection.style.display = 'none';
            this.beatFreqControl.style.display = 'block';
            this.monoFreqControl.style.display = 'none';
            
            // Update volume label to binaural
            volumeIcon.className = 'fas fa-wave-square me-2';
            volumeLabel.innerHTML = '<i class="fas fa-wave-square me-2"></i>Binaural Beats Volume';
        } else {
            this.beatFreqSection.style.display = 'none';
            this.monoFreqSection.style.display = 'block';
            this.beatFreqControl.style.display = 'none';
            this.monoFreqControl.style.display = 'block';
            
            // Update volume label to monochromatic
            volumeIcon.className = 'fas fa-volume-up me-2';
            volumeLabel.innerHTML = '<i class="fas fa-volume-up me-2"></i>Monochromatic Volume';
        }
        
        this.updateFrequencyDisplays();
        
        // Stop current playback if switching modes
        if (this.isPlaying) {
            this.stop();
        }
    }

    updateFrequencyDisplays() {
        if (this.mode === 'binaural') {
            const rightFreq = this.baseFrequency + this.beatFrequency;
            this.rightFreqDisplay.textContent = `${rightFreq.toFixed(1)} Hz`;
            this.beatFreqDisplay.textContent = `${this.beatFrequency.toFixed(1)} Hz`;
            
            // Update beat type description
            this.beatTypeDisplay.textContent = this.getBeatTypeDescription(this.beatFrequency);
        } else {
            this.monoFreqDisplay.textContent = `${this.monoFrequency.toFixed(0)} Hz`;
        }
    }

    getBeatTypeDescription(frequency) {
        if (frequency === 0) return 'No Beat';
        if (frequency <= 4) return 'Delta - Deep Sleep';
        if (frequency <= 8) return 'Theta - Meditation';
        if (frequency <= 13) return 'Alpha - Relaxation';
        if (frequency <= 30) return 'Beta - Focus';
        return 'Gamma - High Cognition';
    }

    async handleMusicFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            this.updateStatus('Loading music file...', 'info');
            
            // Show music status and controls
            this.musicStatus.textContent = `Loading: ${file.name}`;
            this.musicStatus.classList.remove('d-none');
            this.musicStatus.classList.remove('bg-success', 'bg-danger');
            this.musicStatus.classList.add('bg-info');
            this.clearMusicBtn.classList.remove('d-none');

            // Read file as ArrayBuffer
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            
            // Initialize audio context if needed
            if (!this.audioContext) {
                const initialized = await this.initializeAudioContext();
                if (!initialized) {
                    throw new Error('Failed to initialize audio context');
                }
            }

            // Decode audio data
            this.musicBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            this.hasMusicFile = true;
            this.musicVolumeControl.style.display = 'block';
            
            this.musicStatus.textContent = `Loaded: ${file.name}`;
            this.musicStatus.classList.remove('bg-info');
            this.musicStatus.classList.add('bg-success');
            this.updateStatus('Music file loaded successfully', 'success');

            console.log('Music buffer loaded:', {
                duration: this.musicBuffer.duration,
                sampleRate: this.musicBuffer.sampleRate,
                numberOfChannels: this.musicBuffer.numberOfChannels
            });

        } catch (error) {
            console.error('Error loading music file:', error);
            this.updateStatus('Failed to load music file', 'danger');
            this.musicStatus.textContent = 'Failed to load';
            this.musicStatus.classList.remove('bg-info');
            this.musicStatus.classList.add('bg-danger');
            this.clearMusic();
        }
    }

    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }

    clearMusic() {
        this.musicBuffer = null;
        this.hasMusicFile = false;
        this.musicFileInput.value = '';
        this.musicStatus.classList.add('d-none');
        this.clearMusicBtn.classList.add('d-none');
        this.musicVolumeControl.style.display = 'none';
        
        // Stop music if playing
        if (this.musicSource) {
            try {
                this.musicSource.stop();
                this.musicSource.disconnect();
            } catch (e) {
                // Source might already be stopped
            }
            this.musicSource = null;
        }
        
        this.updateStatus('Music cleared', 'secondary');
    }

    async initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);

            // Create gain node for binaural beats
            this.binauralGainNode = this.audioContext.createGain();
            this.binauralGainNode.gain.setValueAtTime(this.binauralVolume, this.audioContext.currentTime);
            this.binauralGainNode.connect(this.masterGain);

            // Create gain node for music
            this.musicGainNode = this.audioContext.createGain();
            this.musicGainNode.gain.setValueAtTime(this.musicVolume, this.audioContext.currentTime);
            this.musicGainNode.connect(this.masterGain);

            // Create channel merger for stereo binaural output
            this.merger = this.audioContext.createChannelMerger(2);
            this.merger.connect(this.binauralGainNode);

            console.log('Audio context initialized with nodes:', {
                audioContext: !!this.audioContext,
                masterGain: !!this.masterGain,
                binauralGainNode: !!this.binauralGainNode,
                musicGainNode: !!this.musicGainNode,
                merger: !!this.merger
            });

            return true;
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
            this.updateStatus('Audio initialization failed', 'danger');
            return false;
        }
    }

    createOscillators() {
        try {
            if (this.mode === 'binaural') {
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
            } else {
                // Monochromatic oscillator
                this.monoOscillator = this.audioContext.createOscillator();
                this.monoOscillator.type = 'sine';
                this.monoOscillator.frequency.setValueAtTime(this.monoFrequency, this.audioContext.currentTime);
                this.monoOscillator.connect(this.binauralGainNode); // Connect directly to gain node
            }

            return true;
        } catch (error) {
            console.error('Failed to create oscillators:', error);
            this.updateStatus('Oscillator creation failed', 'danger');
            return false;
        }
    }

    updateOscillatorFrequencies() {
        if (this.mode === 'binaural' && this.leftOscillator && this.rightOscillator) {
            try {
                const rightFreq = this.baseFrequency + this.beatFrequency;
                this.rightOscillator.frequency.setValueAtTime(rightFreq, this.audioContext.currentTime);
            } catch (error) {
                console.error('Failed to update binaural frequencies:', error);
            }
        } else if (this.mode === 'mono' && this.monoOscillator) {
            try {
                this.monoOscillator.frequency.setValueAtTime(this.monoFrequency, this.audioContext.currentTime);
            } catch (error) {
                console.error('Failed to update mono frequency:', error);
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

            if (this.mode === 'binaural') {
                this.leftOscillator.start();
                this.rightOscillator.start();
            } else {
                this.monoOscillator.start();
            }
// === Enable recording for download ===
 const destination = this.audioContext.createMediaStreamDestination();
  this.masterGain.connect(destination);

  // choose MP4/AAC if available, otherwise WebM/Opus
  const mime = MediaRecorder.isTypeSupported('audio/mp4;codecs="mp4a.40.2"')
    ? 'audio/mp4;codecs="mp4a.40.2"'
    : 'audio/webm;codecs=opus';

  this.mediaRecorder = new MediaRecorder(destination.stream, { mimeType: mime });
  this.chunks = [];
  this.mediaRecorder.ondataavailable = e => this.chunks.push(e.data);

  this.mediaRecorder.onstop = () => {
    const blob = new Blob(this.chunks, { type: mime });
    const url  = URL.createObjectURL(blob);
    const dl   = document.getElementById('downloadLink');
    dl.href          = url;
    dl.download      = `${this.mode === 'binaural' ? 'binaural_mix' : 'pure_tone'}.${mime.startsWith('audio/mp4') ? 'mp4' : 'webm'}`;
    dl.classList.remove('d-none');
  };

  this.mediaRecorder.start();

            // Start music if available
            if (this.hasMusicFile && this.musicBuffer) {
                this.createMusicSource();
                if (this.musicSource) {
                    this.musicSource.start();
                    console.log('Music source started');
                }
            }

            this.isPlaying = true;
            this.isPaused = false;
            const statusText = this.hasMusicFile ? 
                `Playing ${this.mode} with music` : 
                `Playing ${this.mode}`;
            this.updateStatus(statusText, 'success');
            this.updateControlStates();

        } catch (error) {
            console.error('Playback failed:', error);
            this.updateStatus('Playback failed', 'danger');
        }
    }

    createMusicSource() {
        if (!this.musicBuffer || !this.audioContext || !this.musicGainNode) {
            console.log('Missing requirements for music source:', {
                musicBuffer: !!this.musicBuffer,
                audioContext: !!this.audioContext,
                musicGainNode: !!this.musicGainNode
            });
            return null;
        }

        try {
            this.musicSource = this.audioContext.createBufferSource();
            this.musicSource.buffer = this.musicBuffer;
            this.musicSource.loop = true; // Loop the music
            this.musicSource.connect(this.musicGainNode);
            
            console.log('Music source created and connected to gain node');

            // Handle music ending (in case loop fails)
            this.musicSource.onended = () => {
                console.log('Music ended, restarting...');
                if (this.isPlaying && !this.isPaused) {
                    // Restart music if still playing
                    const newSource = this.createMusicSource();
                    if (newSource) {
                        newSource.start();
                    }
                }
            };
            
            return this.musicSource;
        } catch (error) {
            console.error('Failed to create music source:', error);
            return null;
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
            // Stop binaural oscillators
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

            // Stop mono oscillator
            if (this.monoOscillator) {
                this.monoOscillator.stop();
                this.monoOscillator.disconnect();
                this.monoOscillator = null;
            }

            // Stop music
            if (this.musicSource) {
                this.musicSource.stop();
                this.musicSource.disconnect();
                this.musicSource = null;
            }
// Stop media recorder if recording
if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
    this.mediaRecorder.stop();
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
