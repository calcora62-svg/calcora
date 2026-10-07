import { pipeline, env } from '@huggingface/transformers';

// Disable local model searches to force downloading from huggingface
env.allowLocalModels = false;

let transcriber: any = null;

async function getTranscriber(progressCallback: (data: any) => void) {
  if (transcriber) return transcriber;

  try {
    console.log('Attempting to load Whisper with WebGPU...');
    // We pass device: 'webgpu'
    transcriber = await pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny', {
      device: 'webgpu',
      progress_callback: progressCallback,
    });
    console.log('Whisper loaded successfully with WebGPU.');
  } catch (error) {
    console.warn('WebGPU not supported or failed to initialize, falling back to WASM/CPU...', error);
    try {
      transcriber = await pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny', {
        device: 'wasm',
        progress_callback: progressCallback,
      });
      console.log('Whisper loaded successfully with WASM/CPU.');
    } catch (wasmError: any) {
      console.warn('WASM/CPU initialization failed, trying with default configuration...', wasmError);
      transcriber = await pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny', {
        progress_callback: progressCallback,
      });
    }
  }
  return transcriber;
}

self.onmessage = async (event: MessageEvent) => {
  const { audioData, language } = event.data;

  try {
    self.postMessage({ type: 'status', status: 'Loading speech model...', progress: 10 });
    
    const pipe = await getTranscriber((data: any) => {
      if (data.status === 'progress') {
        const progressVal = Math.round(data.progress || 0);
        self.postMessage({
          type: 'status',
          status: `Downloading speech model... ${progressVal}%`,
          progress: 10 + Math.round(progressVal * 0.4) // Scaled progress from 10% to 50%
        });
      }
    });

    self.postMessage({ type: 'status', status: 'Transcribing...', progress: 60 });

    const options: any = {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: true,
      task: 'transcribe',
    };

    if (language && language !== 'auto' && language !== 'Auto Detect') {
      options.language = language;
    }

    const output = await pipe(audioData, options);

    self.postMessage({ type: 'status', status: 'Creating timestamps...', progress: 95 });
    self.postMessage({ type: 'result', output });

  } catch (err: any) {
    console.error('Worker error:', err);
    self.postMessage({ type: 'error', error: err.message || 'Inference failed' });
  }
};
