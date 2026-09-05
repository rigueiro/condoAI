import type { ImgHTMLAttributes } from "react";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
};

function Image({ src, alt = "Image Name", className = "", ...props }: Props) {
  // Empty-string src makes the browser re-fetch the current page.
  if (!src) return null;

  return (
    // Generic wrapper for arbitrary/dynamic external URLs (e.g. user avatars),
    // where next/image's domain config and optimization aren't a good fit.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} {...props} />
  );
}

export default Image;
