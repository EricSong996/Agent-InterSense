import type { PendingImage } from '../types'

interface ImageAttachmentChipProps {
  item: PendingImage
  onRemove: () => void
}

/** 豆包风格：加载时扫光 + 柔焦，完成后清晰展示 */
export function ImageAttachmentChip({ item, onRemove }: ImageAttachmentChipProps) {
  const isLoading = item.status === 'loading'
  const isError = item.status === 'error'

  return (
    <div
      className={`image-attach-chip relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl border bg-[#1a1a1a] ${
        isError
          ? 'border-red-800/60'
          : isLoading
            ? 'border-[#3a5a4a]/80 image-attach-chip--loading'
            : 'border-[#3a3a3a]'
      }`}
    >
      {!isError && item.previewUrl ? (
        <img
          src={item.previewUrl}
          alt=""
          className={`h-full w-full object-cover transition-all duration-500 ${
            isLoading ? 'scale-105 blur-[3px] brightness-75' : 'blur-0 brightness-100'
          }`}
        />
      ) : null}

      {isLoading && (
        <>
          <div className="image-attach-shimmer pointer-events-none absolute inset-0" aria-hidden />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="image-attach-spinner h-6 w-6 rounded-full border-2 border-[#10a37f]/30 border-t-[#10a37f]" />
          </div>
        </>
      )}

      {isError && (
        <div className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] text-red-400">
          {item.error ?? '失败'}
        </div>
      )}

      <button
        type="button"
        onClick={onRemove}
        className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/65 text-[#ececec] hover:bg-black/85 transition-colors"
        aria-label="移除图片"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
