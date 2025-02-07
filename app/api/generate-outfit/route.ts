import { Client } from '@gradio/client'
import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic' // Disable static optimization

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

async function predictWithRetry(
  client: Client,
  endpoint: string,
  params: PredictionParams,
  maxRetries = 3,
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1}: Sending request to ${endpoint}`)

      // Make the prediction with the prepared files
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

      // Parse quota error message
      const quotaMatch = error?.message?.match(/retry in (\d+):(\d+):(\d+)/)
      if (quotaMatch) {
        const [_, hours, minutes, seconds] = quotaMatch
        const waitTimeMs =
          (Number(hours) * 60 * 60 + Number(minutes) * 60 + Number(seconds)) *
          1000

        if (i === maxRetries - 1) {
          throw new Error(
            `GPU quota exceeded. Please try again in ${hours}h ${minutes}m ${seconds}s`,
          )
        }

        console.log(
          `GPU quota exceeded, waiting for ${hours}h ${minutes}m ${seconds}s...`,
        )
        await delay(waitTimeMs + 1000) // Add 1 second buffer
        continue
      }

      // If we're on the last retry, throw the error
      if (i === maxRetries - 1) {
        throw new Error(
          `Failed after ${maxRetries} attempts: ${error.message || JSON.stringify(error)}`,
        )
      }

      // Otherwise wait and retry
      const waitTime = 5000 * (i + 1) // Exponential backoff
      console.log(`Retrying in ${waitTime / 1000} seconds...`)
      await delay(waitTime)
    }
  }
}

async function createGradioClient(): Promise<Client> {
  console.log('Creating Gradio client...')
  const client = await Client.connect('levihsu/OOTDiffusion', {
    hf_token: process.env.HUGGING_FACE_TOKEN as `hf_${string}`,
  })
  console.log('Gradio client connected successfully')
  return client
}

function extractImageData(result: PredictionResult) {
  if (
    result?.data &&
    Array.isArray(result.data) &&
    result.data[0]?.[0]?.image?.url
  ) {
    return result.data[0][0].image.url
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    const modelImage = formData.get('modelImage') as File
    const garmentImage = formData.get('garmentImage') as File
    const category = formData.get('category') as string
    const nSamples = formData.get('nSamples') as string
    const nSteps = formData.get('nSteps') as string
    const imageScale = formData.get('imageScale') as string
    const seed = formData.get('seed') as string

    if (!modelImage || !garmentImage) {
      return NextResponse.json(
        { error: 'Model image and garment image are required' },
        { status: 400 },
      )
    }

    const client = await createGradioClient()
    const endpoint = category ? '/process_dc' : '/process_hd'
    const params = {
      vton_img: modelImage,
      garm_img: garmentImage,
      ...(category && { category }),
      n_samples: Number(nSamples),
      n_steps: Number(nSteps),
      image_scale: Number(imageScale),
      seed: Number(seed),
    }

    console.log('Sending prediction request...')
    const result = await predictWithRetry(client, endpoint, params)

    console.log('Raw result:', result)
    console.log('Result type:', typeof result)

    let imageData = null
    imageData = extractImageData(result!)

    if (!imageData) {
      throw new Error('No image data received from the model')
    }

    console.log('Image data:', imageData)
    return NextResponse.json({ result: imageData, success: true })
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
        details: process.env.NODE_ENV === 'development' ? error : undefined,
        success: false,
      },
      { status: 500 },
    )
  }
}
