import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  icon?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', label, helperText, icon, rightAction, ...props }, ref) => {
    const uniqueId = React.useId();

    return (
      <div className="flex flex-col space-y-1.5 w-full">
        {label && (
          <label 
            htmlFor={uniqueId}
            className="text-xs font-semibold uppercase tracking-wider text-esg-muted"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-esg-muted pointer-events-none">
              {icon}
            </div>
          )}
          <input
            id={uniqueId}
            type={type}
            ref={ref}
            className={`h-10 w-full rounded-xl border border-esg-border bg-esg-clay text-sm text-esg-text focus-ring transition-colors duration-150 placeholder:text-esg-muted/70 ${
              icon ? 'pl-10' : 'pl-3'
            } ${rightAction ? 'pr-10' : 'pr-3'} ${className}`}
            {...props}
          />
          {rightAction && (
            <div className="absolute right-3 flex items-center">
              {rightAction}
            </div>
          )}
        </div>
        {helperText && (
          <p className="text-xs text-esg-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
