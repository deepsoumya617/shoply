import { Job, Worker } from 'bullmq'
import redis from '../config/redis'
import cloudinary from '../config/cloudinary'
import { Readable } from 'stream'
import { db } from '../config/db'
import { productImages } from '../db/schema'

// helper function to upload img on cloudinary
async function uploadImgToCloudinary(
  buffer: Buffer,
  options = {}
): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    // create the cloudinary upload stream(writable)
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error: any, result: any) => {
        if (error) reject(error)
        resolve(result)
      }
    )

    // convert the buffer into a readable stream
    const readableStream = Readable.from(buffer)

    // pipe the readable stream into Cloudinary’s upload stream
    readableStream.pipe(uploadStream)
  })
}

export function startImageWorker() {
  const imageWorker = new Worker(
    'image-upload',
    async (job: Job) => {
      let { productId, fileBuffer } = job.data as {
        productId: string
        fileBuffer: Buffer
      }

      // reconstruct the buffer (handle serialized Buffer from Bull or ArrayBuffer/TypedArray)
      if (!(fileBuffer instanceof Buffer)) {
        const fb: any = fileBuffer
        // If the buffer was serialized to { type: 'Buffer', data: number[] }
        if (fb && Array.isArray(fb.data)) {
          fileBuffer = Buffer.from(fb.data)
        } else {
          // Fallback for ArrayBuffer, TypedArray or other Buffer-like values
          fileBuffer = Buffer.from(fb)
        }
      }

      // upload to cloudinary
      const result = await uploadImgToCloudinary(fileBuffer, {
        folder: `products/${productId}`,
        resource_type: 'image',
      })

      // store uploaded image data in db
      await db.insert(productImages).values({
        productId,
        imageUrl: result.secure_url,
      })

      return { status: 'success' }
    },
    {
      connection: redis,
      concurrency: 5,
      stalledInterval: 30000,
      maxStalledCount: 3,
    }
  )

  imageWorker.on('completed', job => {
    console.log(`Job with ID ${job.id} ${job.name} has been completed`)
  })

  imageWorker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} ${job?.name} failed:`)
    console.error(err)
  })

  // shutdown worker gracefully
  process.on('SIGTERM', async () => {
    console.log('Shutting down worker...')
    await imageWorker.close()
    process.exit(0)
  })
}
