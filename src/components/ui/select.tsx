"use client";

import React, { forwardRef, SelectHTMLAttributes } from "react";
import Icon from "../icon";

type SelectSize = "sm" | "md";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  containerClassName?: string;
  selectSize?: SelectSize;
}

const sizeClasses: Record<SelectSize, string> = {
  sm: "py-1 pl-2 pr-7 text-xs",
  md: "py-2 pl-3 pr-9 text-sm",
};

const iconPosition: Record<SelectSize, string> = {
  sm: "right-2",
  md: "right-3",
};

const iconPixelSize: Record<SelectSize, number> = {
  sm: 14,
  md: 16,
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className = "",
      containerClassName = "",
      invalid = false,
      disabled,
      selectSize = "md",
      children,
      ...props
    },
    ref,
  ) => {
    const base =
      "w-full appearance-none rounded-lg border bg-surface text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed transition-smooth";
    const borderClass = invalid ? "border-error" : "border-border-medium";

    return (
      <div className={`relative ${containerClassName}`}>
        <select
          ref={ref}
          disabled={disabled}
          className={`${base} ${sizeClasses[selectSize]} ${borderClass} ${className}`}
          {...props}
        >
          {children}
        </select>
        <Icon
          name="ChevronDown"
          size={iconPixelSize[selectSize]}
          className={`absolute ${iconPosition[selectSize]} top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none ${
            disabled ? "opacity-60" : ""
          }`}
        />
      </div>
    );
  },
);

Select.displayName = "Select";

export default Select;
