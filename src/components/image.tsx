import React from "react";

interface Props {
  src: string;
  alt?: string;
  className?: string;
  [key: string]: any; // To allow any other img attributes like width, height, style, etc.
}

function Image({ src, alt = "Image Name", className = "", ...props }: Props) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        // e.target.src = "/assets/images/no_image.png";
      }}
      {...props}
    />
  );
}

export default Image;
