import React from "react";
import * as LucideIcons from "lucide-react";
import { HelpCircle } from "lucide-react";

interface Props {
  name: string; // Name of the icon from lucide-react
  size?: number; // Size of the icon (default: 24)
  color?: string; // Color of the icon (default: "currentColor")
  className?: string; // Additional CSS classes
  strokeWidth?: number; // Stroke width of the icon (default: 2)
  [key: string]: any; // Other props
}

function Icon({
  name,
  size = 24,
  color = "currentColor",
  className = "",
  strokeWidth = 2,
  ...props
}: Props) {
  const IconComponent =
    LucideIcons[name as keyof typeof LucideIcons] as React.ComponentType<{
      size?: number;
      color?: string;
      strokeWidth?: number;
      className?: string;
    }>;

  if (!IconComponent) {
    return (
      <HelpCircle
        size={size}
        color="gray"
        strokeWidth={strokeWidth}
        className={className}
        {...props}
      />
    );
  }

  return (
    <IconComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
      {...props}
    />
  );
}
export default Icon;
