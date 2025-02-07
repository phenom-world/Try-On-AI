'use client'

export async function generateOutfit(
  modelImage: File,
  garmentImage: File,
  category: string | null,
  nSamples: number,
  nSteps: number,
  imageScale: number,
  seed: number,
) {
  try {
    const formData = new FormData()
    formData.append('modelImage', modelImage)
    formData.append('garmentImage', garmentImage)
    if (category) formData.append('category', category)
    formData.append('nSamples', nSamples.toString())
    formData.append('nSteps', nSteps.toString())
    formData.append('imageScale', imageScale.toString())
    formData.append('seed', seed.toString())

    const response = await fetch('/api/generate-outfit', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to generate outfit')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error generating outfit:', error)
    throw error
  }
}
