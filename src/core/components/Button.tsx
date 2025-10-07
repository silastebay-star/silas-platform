// SILAS Core Button Component
// Shared button component with consistent styling and behavior

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/core/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const buttonVariants = {
  primary: 'bg-[#4C764C] text-white hover:bg-[#3d5f3d] focus:ring-[#4C764C]/20',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500/20',
  outline: 'border-2 border-[#4C764C] text-[#4C764C] hover:bg-[#4C764C] hover:text-white focus:ring-[#4C764C]/20',
  ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500/20',
  destructive: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500/20'
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg'
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  className,
  disabled,
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      className={cn(
        // Base styles
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        
        // Variant styles
        buttonVariants[variant],
        
        // Size styles
        buttonSizes[size],
        
        // Width
        fullWidth && 'w-full',
        
        // Custom className
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {/* Left icon or loading spinner */}
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : leftIcon ? (
        <span className="mr-2">{leftIcon}</span>
      ) : null}
      
      {/* Button content */}
      {children}
      
      {/* Right icon */}
      {rightIcon && !isLoading && (
        <span className="ml-2">{rightIcon}</span>
      )}
    </button>
  );
};

export default Button;
