import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', ...props }, ref) => {
    let baseStyles = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-ring disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
    
    let variantStyles = "";
    switch (variant) {
      case 'primary':
        variantStyles = "bg-esg-sage text-esg-dark shadow-sm hover:bg-opacity-80 active:bg-opacity-90";
        break;
      case 'secondary':
        variantStyles = "bg-esg-moss text-esg-text hover:bg-opacity-80 active:bg-opacity-90";
        break;
      case 'outline':
        variantStyles = "border border-esg-border text-esg-text hover:bg-esg-moss/50";
        break;
      case 'ghost':
        variantStyles = "text-esg-text hover:bg-esg-moss/45";
        break;
      case 'accent':
        variantStyles = "bg-esg-sand text-esg-dark hover:bg-opacity-85 shadow-sm";
        break;
      case 'link':
        variantStyles = "text-esg-muted hover:text-esg-dark underline-offset-4 hover:underline px-0 bg-transparent";
        break;
    }

    let sizeStyles = "";
    switch (size) {
      case 'sm':
        sizeStyles = "h-8 px-3 text-xs";
        break;
      case 'md':
        sizeStyles = "h-10 px-4 text-sm";
        break;
      case 'lg':
        sizeStyles = "h-12 px-6 text-base";
        break;
      case 'icon':
        sizeStyles = "h-9 w-9 p-0 rounded-xl";
        break;
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
