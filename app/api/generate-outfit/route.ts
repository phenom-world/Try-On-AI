import { Client } from '@gradio/client'
import { NextRequest, NextResponse } from 'next/server'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

interface PredictionParams {
  vton_img: File
  garm_img: File
  category?: string
  n_samples: number
  n_steps: number
  image_scale: number
  seed: number
}

interface PredictionResult {
  data?: Array<Array<{ image: { url: string } }>>
}

async function handleQuotaError(
  error: Error,
  attempt: number,
  maxRetries: number,
): Promise<number> {
  const quotaMatch = error.message.match(/retry in (\d+):(\d+):(\d+)/)
  if (!quotaMatch) throw error

  const [_, hours, minutes, seconds] = quotaMatch
  const waitTimeMs =
    (Number(hours) * 60 * 60 + Number(minutes) * 60 + Number(seconds)) * 1000

  if (attempt === maxRetries - 1) {
    throw new Error(
      `GPU quota exceeded. Please try again in ${hours}h ${minutes}m ${seconds}s`,
    )
  }

  console.log(
    `GPU quota exceeded, waiting for ${hours}h ${minutes}m ${seconds}s...`,
  )
  return waitTimeMs + 1000 // Add 1 second buffer
}

async function predictWithRetry(
  client: Client,
  endpoint: string,
  params: PredictionParams,
  maxRetries = 3,
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1}: Sending request to ${endpoint}`)
      console.log('Making prediction with params:', {
        ...params,
        vton_img: params.vton_img ? 'File data...' : null,
        garm_img: params.garm_img ? 'File data...' : null,
      })

      const result = (await client.predict(
        endpoint,
        params as unknown as Record<string, unknown>,
      )) as PredictionResult
      return result
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error)

      if (error instanceof Error) {
        try {
          const waitTime = await handleQuotaError(error, i, maxRetries)
          await delay(waitTime)
          continue
        } catch (quotaError) {
          if (i === maxRetries - 1) throw quotaError
        }
      }

      if (i === maxRetries - 1) {
        throw new Error(
          `Failed after ${maxRetries} attempts: ${
            error instanceof Error ? error.message : JSON.stringify(error)
          }`,
        )
      }

      const waitTime = 5000 * (i + 1) // Exponential backoff
      console.log(`Retrying in ${waitTime / 1000} seconds...`)
      await delay(waitTime)
    }
  }
}

async function validateInput(
  modelImage: File,
  garmentImage: File,
  category?: string,
) {
  if (!modelImage || !garmentImage) {
    throw new Error('Model image and garment image are required')
  }

  return { modelImage, garmentImage, category }
}

async function createGradioClient(): Promise<Client> {
  console.log('Creating Gradio client...')
  const client = await Client.connect('levihsu/OOTDiffusion', {
    hf_token: process.env.HUGGING_FACE_TOKEN as `hf_${string}`,
  })
  console.log('Gradio client connected successfully')
  return client
}

function extractImageData(result: PredictionResult): string {
  if (!result?.data?.[0]?.[0]?.image?.url) {
    throw new Error('No image data received from the model')
  }
  return result.data[0][0].image.url
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const modelImage = formData.get('modelImage') as File
    const garmentImage = formData.get('garmentImage') as File
    const category = formData.get('category') as string | null
    const nSamples = Number(formData.get('nSamples'))
    const nSteps = Number(formData.get('nSteps'))
    const imageScale = Number(formData.get('imageScale'))
    const seed = Number(formData.get('seed'))

    await validateInput(modelImage, garmentImage, category || undefined)
    const client = await createGradioClient()

    const endpoint = category ? '/process_dc' : '/process_hd'
    const params: PredictionParams = {
      vton_img: modelImage,
      garm_img: garmentImage,
      ...(category && { category }),
      n_samples: nSamples,
      n_steps: nSteps,
      image_scale: imageScale,
      seed: seed,
    }

    console.log('Sending prediction request...')
    const result = await predictWithRetry(client, endpoint, params)

    console.log('Raw result:', result)
    const imageData = extractImageData(result!)
    console.log('Image data:', imageData)

    return NextResponse.json({ result: imageData })
  } catch (error) {
    console.error('Detailed error information:', {
      name: error instanceof Error ? error.name : 'Unknown Error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      cause:
        error instanceof Error
          ? (error as Error & { cause?: unknown }).cause
          : undefined,
    })

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to process model response',
      },
      { status: 500 },
    )
  }
}
