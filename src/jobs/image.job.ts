import { imageQueue } from '../config/queue'

export async function enqueueImageUploadJob(jobData: {
  productId: string
  fileBuffer: Buffer
}) {
  await imageQueue.add('upload-image', jobData)
}
