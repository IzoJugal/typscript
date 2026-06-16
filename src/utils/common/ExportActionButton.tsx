import React from "react";
import { Tooltip } from "flowbite-react";

interface ExportActionButtonProps {
  label: string;
  Icon?: React.ElementType;
  onClick?: () => void;
  isLoading?: boolean;
  tooltip?: string;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

const ExportActionButton = ({
  label,
  Icon,
  onClick,
  isLoading = false,
  tooltip,
  className = "",
  disabled = false,
  type = "button",
}: ExportActionButtonProps) => {
  const buttonContent = (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        flex items-center justify-center gap-2
        min-h-[40px]
        px-3 sm:px-4
        py-2
        text-xs sm:text-sm
        font-medium
        text-white
        whitespace-nowrap
        rounded-md
        transition-all duration-200
        bg-gradient-to-r from-BRAND-600 to-BRAND-500
        hover:brightness-110
        active:scale-95
        disabled:opacity-50
        disabled:cursor-not-allowed
        dark:bg-DARK-800
        dark:hover:bg-DARK-700
        w-full sm:w-auto
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin shrink-0" />

          <span className="truncate">
            {label}
          </span>
        </>
      ) : (
        <>
          <span className="truncate">
            {label}
          </span>

          {Icon && (
            <Icon className="text-base shrink-0" />
          )}
        </>
      )}
    </button>
  );

  if (!tooltip) {
    return buttonContent;
  }

  return (
    <Tooltip
      content={tooltip}
      placement="top"
      style="dark"
      animation="duration-300"
    >
      <div className="inline-block">
        {buttonContent}
      </div>
    </Tooltip>
  );
};

export default ExportActionButton;