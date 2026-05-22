import type { Provider } from '../config'
import type { Message, MessageImage, PendingImage } from '../types'

export const MAX_IMAGES_PER_MESSAGE = 4
const MAX_EDGE = 1280
const JPEG_QUALITY = 0.82
const MAX_BYTES = 900_000

export function providerSupportsVision(_provider: Provider): boolean {
  return true
}

export function visionUnsupportedHint(provider: Provider): string {
  return `当前模型（${provider}）可能不支持图片理解，请优先使用豆包 Seed 2.0 系列试拍题`
}

function estimateBytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? ''
  return Math.ceil((base64.length * 3) / 4)
}

async function compressImageFile(file: File): Promise<{ dataUrl: string; mime: string }> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法处理图片')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  let quality = JPEG_QUALITY
  let dataUrl = canvas.toDataURL('image/jpeg', quality)
  while (estimateBytes(dataUrl) > MAX_BYTES && quality > 0.45) {
    quality -= 0.08
    dataUrl = canvas.toDataURL('image/jpeg', quality)
  }

  return { dataUrl, mime: 'image/jpeg' }
}

export async function fileToMessageImage(file: File): Promise<MessageImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('仅支持图片文件')
  }
  const { dataUrl, mime } = await compressImageFile(file)
  return {
    id: crypto.randomUUID(),
    dataUrl,
    mime,
  }
}

export async function processImageFile(
  file: File,
  onUpdate: (item: PendingImage) => void
): Promise<PendingImage | null> {
  const id = crypto.randomUUID()
  const previewUrl = URL.createObjectURL(file)
  const loading: PendingImage = { id, status: 'loading', previewUrl }
  onUpdate(loading)

  try {
    const img = await fileToMessageImage(file)
    const ready: PendingImage = {
      id,
      status: 'ready',
      previewUrl: img.dataUrl,
      dataUrl: img.dataUrl,
      mime: img.mime,
    }
    URL.revokeObjectURL(previewUrl)
    onUpdate(ready)
    return ready
  } catch (e) {
    const err = e instanceof Error ? e.message : '图片处理失败'
    URL.revokeObjectURL(previewUrl)
    const failed: PendingImage = {
      id,
      status: 'error',
      previewUrl: '',
      error: err,
    }
    onUpdate(failed)
    return null
  }
}

export function messageHasImages(m: Message): boolean {
  return (m.images?.length ?? 0) > 0
}

export function defaultImagePrompt(): string {
  return '请分析这张图片并回答我的问题。'
}

export function revokePendingPreview(item: PendingImage) {
  if (item.previewUrl.startsWith('blob:')) {
    URL.revokeObjectURL(item.previewUrl)
  }
}
