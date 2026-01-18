/**
 * @description Get the best supported audio MIME type for MediaRecorder
 * Safari/iOS doesn't support webm, so we need to detect and use mp4/aac
 * @returns The best supported MIME type, or empty string for browser default
 */
export function getSupportedMimeType(): string {
  // Priority order: prefer formats that work well with OpenAI transcription
  const types = [
    'audio/webm;codecs=opus', // Chrome, Firefox, Edge
    'audio/webm', // Chrome, Firefox, Edge fallback
    'audio/mp4', // Safari (iOS/macOS)
    'audio/mp4;codecs=mp4a.40.2', // Safari with AAC
    'audio/aac', // Safari alternative
    'audio/ogg;codecs=opus', // Firefox
    'audio/ogg', // Firefox fallback
    'audio/wav', // Universal fallback
  ]
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  return '' // Let browser choose default
}

/**
 * @description Get the file extension for a MIME type
 * @param mimeType - The audio MIME type
 * @returns The file extension
 */
export function getExtensionForMimeType(mimeType: string): string {
  if (mimeType.includes('mp4')) return 'mp4'
  if (mimeType.includes('ogg')) return 'ogg'
  if (mimeType.includes('wav')) return 'wav'
  if (mimeType.includes('aac')) return 'aac'
  return 'webm'
}

/**
 * @description Convert any audio blob to WAV format using Web Audio API
 * WAV is universally supported by OpenAI transcription
 * @param audioBlob - The audio blob to convert
 * @returns Promise resolving to WAV blob
 */
export async function convertToWav(audioBlob: Blob): Promise<Blob> {
  const audioContext = new AudioContext()

  try {
    // Decode the audio data
    const arrayBuffer = await audioBlob.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    // Convert to WAV
    const wavBlob = audioBufferToWav(audioBuffer)
    return wavBlob
  } finally {
    await audioContext.close()
  }
}

/**
 * @description Convert AudioBuffer to WAV Blob
 * @param buffer - The AudioBuffer to convert
 * @returns WAV Blob
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16

  // Interleave channels
  const length = buffer.length * numChannels * (bitDepth / 8)
  const wavBuffer = new ArrayBuffer(44 + length)
  const view = new DataView(wavBuffer)

  // WAV header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + length, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // Subchunk1Size
  view.setUint16(20, format, true) // AudioFormat (PCM)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true) // ByteRate
  view.setUint16(32, numChannels * (bitDepth / 8), true) // BlockAlign
  view.setUint16(34, bitDepth, true)
  writeString(view, 36, 'data')
  view.setUint32(40, length, true)

  // Write audio data
  const channels: Float32Array[] = []
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i))
  }

  let offset = 44
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]))
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff
      view.setInt16(offset, intSample, true)
      offset += 2
    }
  }

  return new Blob([wavBuffer], { type: 'audio/wav' })
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}
