interface BrandLogoProps {
  className?: string
}

/** 固定尺寸的侧栏 logo，使用 SVG 避免原图水印 */
export function BrandLogo({ className = 'h-7 w-7 shrink-0' }: BrandLogoProps) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}logo.svg`}
      alt=""
      width={28}
      height={28}
      className={className}
      draggable={false}
    />
  )
}
