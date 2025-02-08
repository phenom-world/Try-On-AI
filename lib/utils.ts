import { type ClassValue, clsx } from 'clsx'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const loadSampleImages = async (
  callback: (file: File, type: 'model' | 'garment') => void,
) => {
  const modelNum = Math.floor(Math.random() * 5) + 1
  let garmentNum = Math.floor(Math.random() * 9) + 1

  if (modelNum === 5) {
    garmentNum = Math.floor(Math.random() * 4) + 6
  }

  try {
    const [modelBlob, garmentBlob] = await Promise.all([
      fetch(`/samples/model${modelNum}.jpg`).then((res) => res.blob()),
      fetch(`/samples/garment${garmentNum}.jpg`).then((res) => res.blob()),
    ])

    const modelFile = new File([modelBlob], `model${modelNum}.jpg`, {
      type: 'image/jpeg',
    })
    const garmentFile = new File([garmentBlob], `garment${garmentNum}.jpg`, {
      type: 'image/jpeg',
    })

    callback(modelFile, 'model')
    callback(garmentFile, 'garment')
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : 'Failed to load sample images',
    )
  }
}

export const handleDownload = async (result: string) => {
  if (!result) return

  try {
    const response = await fetch(result)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `generated-outfit-${Date.now()}.webp`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (err) {
    console.error('Error downloading image:', err)
    toast.error('Failed to download the image')
  }
}
