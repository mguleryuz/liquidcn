'use client'

import * as React from 'react'

/**
 * @description Props for AudioVisualizer component
 */
export interface AudioVisualizerProps {
  /**
   * @description Whether recording is active
   */
  isRecording: boolean
  /**
   * @description MediaRecorder instance for audio analysis
   */
  mediaRecorder: MediaRecorder | null
  /**
   * @description Canvas width in pixels
   * @default 280
   */
  width?: number
  /**
   * @description Canvas height in pixels
   * @default 60
   */
  height?: number
  /**
   * @description Bar color when recording
   * @default '#a78bfa'
   */
  barColor?: string
  /**
   * @description Width of each bar in pixels
   * @default 3
   */
  barWidth?: number
  /**
   * @description Gap between bars in pixels
   * @default 2
   */
  gap?: number
}

/**
 * @description Audio visualizer component that displays waveform during recording
 * @example
 * <AudioVisualizer
 *   isRecording={isRecording}
 *   mediaRecorder={mediaRecorder}
 *   barColor="#a78bfa"
 * />
 */
export function AudioVisualizer({
  isRecording,
  mediaRecorder,
  width = 280,
  height = 60,
  barColor = '#a78bfa',
  barWidth = 3,
  gap = 2,
}: AudioVisualizerProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const animationRef = React.useRef<number | null>(null)
  const analyserRef = React.useRef<AnalyserNode | null>(null)
  const audioContextRef = React.useRef<AudioContext | null>(null)

  const barCount = Math.floor(width / (barWidth + gap))

  // Draw idle state
  const drawIdle = React.useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)

    for (let i = 0; i < barCount; i++) {
      const barHeight = Math.max(4, 4 + Math.sin(i * 0.3) * 3 + Math.sin(i * 0.7) * 2)
      const x = i * (barWidth + gap)
      const y = (height - barHeight) / 2

      ctx.fillStyle = 'rgba(167, 139, 250, 0.2)'
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2)
      ctx.fill()
    }
  }, [width, height, barWidth, gap, barCount])

  // Active recording visualization
  React.useEffect(() => {
    if (!isRecording || !mediaRecorder || mediaRecorder.state === 'inactive') {
      // Draw idle state when not recording
      drawIdle()
      return
    }

    const audioContext = new AudioContext()
    audioContextRef.current = audioContext
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    analyserRef.current = analyser

    const stream = mediaRecorder.stream
    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      if (!analyserRef.current) return

      animationRef.current = requestAnimationFrame(draw)
      analyserRef.current.getByteFrequencyData(dataArray)

      ctx.clearRect(0, 0, width, height)

      const step = Math.floor(bufferLength / barCount)

      for (let i = 0; i < barCount; i++) {
        const dataIndex = i * step
        const value = dataArray[dataIndex] || 0
        const currentBarHeight = Math.max(4, (value / 255) * height * 0.9)

        const x = i * (barWidth + gap)
        const y = (height - currentBarHeight) / 2

        ctx.fillStyle = barColor
        ctx.beginPath()
        ctx.roundRect(x, y, barWidth, currentBarHeight, barWidth / 2)
        ctx.fill()
      }
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      analyserRef.current = null
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [isRecording, mediaRecorder, width, height, barColor, barWidth, gap, barCount, drawIdle])

  // Draw idle on mount
  React.useEffect(() => {
    if (!isRecording) {
      drawIdle()
    }
  }, [isRecording, drawIdle])

  return <canvas ref={canvasRef} width={width} height={height} style={{ width, height }} />
}
