'use client'

import { Download, ImageIcon, Upload, Wand2 } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useTrialLimit } from '@/hooks/useTrialLimit'
import { handleDownload, loadSampleImages } from '@/lib/utils'

import Footer from '../components/Footer'
import Navbar from '../components/Navbar'

export default function Home() {
  const [modelImage, setModelImage] = useState<File | null>(null)
  const [modelPreview, setModelPreview] = useState<string | null>(null)
  const [garmentImage, setGarmentImage] = useState<File | null>(null)
  const [garmentPreview, setGarmentPreview] = useState<string | null>(null)
  const [nSamples, setNSamples] = useState(1)
  const [nSteps, setNSteps] = useState(20)
  const [imageScale, setImageScale] = useState(2)
  const [seed, setSeed] = useState(-1)
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [category, setCategory] = useState<string>('none')
  const { getTrialData, updateTrialData, getTimeUntilReset } = useTrialLimit()
  const [trialInfo, setTrialInfo] = useState({
    triesLeft: 1,
    timeUntilReset: '',
  })

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const updateTrialInfo = () => {
      const data = getTrialData()
      setTrialInfo({
        triesLeft: data.triesLeft,
        timeUntilReset: getTimeUntilReset(),
      })
    }

    updateTrialInfo()
    const interval = setInterval(updateTrialInfo, 60000) // Update every minute
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleImageChange = (file: File, type: 'model' | 'garment') => {
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (type === 'model') {
          setModelImage(file)
          setModelPreview(reader.result as string)
        } else {
          setGarmentImage(file)
          setGarmentPreview(reader.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    const trialData = getTrialData()
    if (trialData.triesLeft <= 0) {
      toast.error(
        `Daily limit reached. Next try available in ${getTimeUntilReset()}`,
      )
      return
    }

    setLoading(true)
    setResult(null)

    const formData = new FormData()
    if (modelImage) formData.append('modelImage', modelImage)
    if (garmentImage) formData.append('garmentImage', garmentImage)
    if (category !== 'none') formData.append('category', category)
    formData.append('nSamples', nSamples.toString())
    formData.append('nSteps', nSteps.toString())
    formData.append('imageScale', imageScale.toString())
    formData.append('seed', seed.toString())

    try {
      const response = await fetch('/api/generate-outfit', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.status === 429) {
        toast.error(data.error)
        return
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Failed to generate outfit: ${response.status} ${response.statusText}`,
        )
      }

      if (!data.success || !data.result) {
        throw new Error('No result received from the server')
      }

      const imageData = data.result
      if (
        typeof imageData !== 'string' ||
        (!imageData.startsWith('data:image') && !imageData.startsWith('http'))
      ) {
        throw new Error('Invalid image data received')
      }

      setResult(imageData)
      updateTrialData()
    } catch (err) {
      console.error('Error in handleSubmit:', err)
      if (err instanceof Error) {
        toast.error(`Error: ${err.message}`)
      } else {
        toast.error('An unexpected error occurred while generating the outfit')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isClient) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#0A0A0B] dark:to-[#1a1a1d] text-gray-900 dark:text-white">
      <Navbar />

      <div className="container max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16 space-y-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
              Virtual Try-On
            </span>
            <span className="text-blue-600 dark:text-blue-500"> AI</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-xl sm:max-w-2xl mx-auto leading-relaxed">
            Experience clothes virtually before you buy. Upload your photo and
            instantly see how any garment looks on you with our AI-powered
            try-on technology.
          </p>

          <div className="max-w-2xl mx-auto mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-yellow-600 dark:text-yellow-500 text-xl">
                ⚠️
              </span>
              <div className="text-sm text-yellow-700 dark:text-yellow-400">
                <p className="font-semibold mb-2">
                  This demo uses free GPU quota which is limited. To avoid
                  errors:
                </p>

                <ul className="list-disc list-inside space-y-1 text-yellow-600 dark:text-yellow-400 text-left">
                  <li>Use lower values for Steps (10-15) and Scale (1-2)</li>
                  <li>Wait between attempts if you get a quota error</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="border-gray-200 dark:border-gray-800/50 bg-white/40 dark:bg-black/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Upload Photos
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Choose your photo and the garment you want to try on or{' '}
                <button
                  onClick={() => loadSampleImages(handleImageChange)}
                  className="text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
                >
                  load sample images
                </button>
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="modelImage"
                    className="text-gray-700 dark:text-gray-300"
                  >
                    Your Photo
                  </Label>
                  <div className="relative group">
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 transition-colors group-hover:border-blue-500/50 group-hover:bg-blue-500/5">
                      <Input
                        id="modelImage"
                        type="file"
                        onChange={(e) =>
                          handleImageChange(
                            e.target.files?.[0] as File,
                            'model',
                          )
                        }
                        className="hidden"
                        required
                      />
                      <label
                        htmlFor="modelImage"
                        className="flex flex-col items-center cursor-pointer"
                      >
                        {modelPreview ? (
                          <Image
                            src={modelPreview}
                            alt="Model preview"
                            width={200}
                            height={200}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <>
                            <Upload className="h-12 w-12 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors" />
                            <span className="mt-2 text-sm text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors">
                              Upload your photo
                            </span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="garmentImage"
                    className="text-gray-700 dark:text-gray-300"
                  >
                    Garment Photo
                  </Label>
                  <div className="relative group">
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 transition-colors group-hover:border-blue-500/50 group-hover:bg-blue-500/5">
                      <Input
                        id="garmentImage"
                        type="file"
                        onChange={(e) =>
                          handleImageChange(
                            e.target.files?.[0] as File,
                            'garment',
                          )
                        }
                        className="hidden"
                        required
                      />
                      <label
                        htmlFor="garmentImage"
                        className="flex flex-col items-center cursor-pointer"
                      >
                        {garmentPreview ? (
                          <Image
                            src={garmentPreview}
                            alt="Garment preview"
                            width={200}
                            height={200}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <>
                            <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors" />
                            <span className="mt-2 text-sm text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors">
                              Upload garment
                            </span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 mt-4">
                <div className="space-y-3">
                  <Label
                    htmlFor="category"
                    className="text-gray-700 dark:text-gray-300"
                  >
                    Garment Category
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full bg-white/40 dark:bg-black/40 border-gray-200 dark:border-gray-800">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/90 dark:bg-black/90 border-gray-200 dark:border-gray-800">
                      <SelectItem value="none">None (HD Processing)</SelectItem>
                      <SelectItem value="Upper-body">Upper Body</SelectItem>
                      <SelectItem value="Lower-body">Lower Body</SelectItem>
                      <SelectItem value="Dress">Dress</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Label className="text-gray-700 dark:text-gray-300">
                            Samples: {nSamples}
                          </Label>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Number of variations to generate</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Slider
                      id="nSamples"
                      min={1}
                      max={4}
                      step={1}
                      value={[nSamples]}
                      onValueChange={(value) => setNSamples(value[0])}
                      className="mt-2"
                    />
                  </div>

                  <div className="space-y-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Label className="text-gray-700 dark:text-gray-300">
                            Steps: {nSteps}
                          </Label>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Number of denoising steps - higher means better
                            quality but slower
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Slider
                      id="nSteps"
                      min={1}
                      max={50}
                      step={1}
                      value={[nSteps]}
                      onValueChange={(value) => setNSteps(value[0])}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Label className="text-gray-700 dark:text-gray-300">
                            Guidance Scale: {imageScale.toFixed(1)}
                          </Label>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            How closely to follow the input image - higher
                            values give more faithful results
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Slider
                      id="imageScale"
                      min={0.1}
                      max={20}
                      step={0.1}
                      value={[imageScale]}
                      onValueChange={(value) => setImageScale(value[0])}
                      className="mt-2"
                    />
                  </div>

                  <div className="space-y-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Label
                            htmlFor="seed"
                            className="text-gray-700 dark:text-gray-300"
                          >
                            Random Seed
                          </Label>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Set a specific seed to get reproducible results</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Input
                      id="seed"
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(parseInt(e.target.value))}
                      className="bg-white/40 dark:bg-black/40 border-gray-200 dark:border-gray-800"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  disabled={
                    loading ||
                    trialInfo.triesLeft <= 0 ||
                    !modelImage ||
                    !garmentImage
                  }
                  onClick={handleSubmit}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white border-none rounded-lg transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Wand2 className="h-5 w-5 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : trialInfo.triesLeft <= 0 ? (
                    <span className="text-gray-300">
                      Try again in {trialInfo.timeUntilReset}
                    </span>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Wand2 className="h-5 w-5" />
                      <span>Generate outfit</span>
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800/50 bg-white/40 dark:bg-black/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Preview
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                See how the garment looks on you
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="space-y-6 p-8">
                  <div className="flex items-center justify-center">
                    <div className="relative h-32 w-32">
                      <div className="absolute inset-0 animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-400"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Wand2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-center text-sm font-medium text-blue-600 dark:text-blue-400">
                      Generating your virtual try-on...
                    </p>
                    <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                      This may take up to a minute
                    </p>
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
                    <Image
                      src={result}
                      alt="Generated Outfit"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <Button
                    onClick={() => handleDownload(result)}
                    className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Result
                  </Button>
                </div>
              )}

              {!loading && !result && (
                <div className="h-[400px] flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-xl">
                  <p>Your generated outfit will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  )
}
