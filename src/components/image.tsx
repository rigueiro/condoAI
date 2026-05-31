import React from "react";

interface Props {
  src: string;
  alt?: string;
  className?: string;
  [key: string]: any; // To allow any other img attributes like width, height, style, etc.
}

function Image({ src, alt = "Image Name", className = "", ...props }: Props) {
  return (
    // Generic wrapper for arbitrary/dynamic external URLs (e.g. user avatars),
    // where next/image's domain config and optimization aren't a good fit.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} {...props} />
  );
}

export default Image;
