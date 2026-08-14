/**
 * Web Worker for Off-Thread Laplacian Edge Variance & Image Sharpness Calculation.
 * Runs on background thread to keep 60 FPS video framing smooth.
 */
self.onmessage = function (e) {
  const { imageData, width, height, id } = e.data

  if (!imageData || !width || !height) {
    self.postMessage({ id, sharpness: 0, status: 'error' })
    return
  }

  const data = imageData.data
  const gray = new Float32Array(width * height)

  // 1. Convert RGBA to Grayscale
  for (let i = 0; i < data.length; i += 4) {
    gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
  }

  // 2. Apply 3x3 Laplacian Convolution Kernel:
  // [  0,  1,  0 ]
  // [  1, -4,  1 ]
  // [  0,  1,  0 ]
  let sum = 0
  let count = 0
  const laplacianScores = new Float32Array((width - 2) * (height - 2))

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      const val =
        gray[idx - width] +
        gray[idx - 1] +
        gray[idx + 1] +
        gray[idx + width] -
        4 * gray[idx]

      laplacianScores[count] = val
      sum += val
      count++
    }
  }

  // 3. Compute Variance of Laplacian Scores
  const mean = sum / count
  let varianceSum = 0
  for (let i = 0; i < count; i++) {
    const diff = laplacianScores[i] - mean
    varianceSum += diff * diff
  }

  const sharpness = Math.round((varianceSum / count) * 10) / 10

  self.postMessage({
    id,
    sharpness,
    pass: sharpness >= 8.0,
    status: 'success'
  })
}
