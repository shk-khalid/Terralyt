import * as React from "react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'warning' | 'error';
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    let variantStyles = "";
    
    switch (variant) {
      case 'default':
        variantStyles = "bg-esg-moss/40 border-esg-border/80 text-esg-text";
        break;
      case 'warning':
        variantStyles = "bg-esg-sand/15 border-esg-sand/70 text-esg-dark";
        break;
      case 'error':
        variantStyles = "bg-red-50/70 border-red-200 text-red-900";
        break;
    }

    return (
      <div
        ref={ref}
        role="alert"
        className={`relative w-full rounded-xl border p-4 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7 ${variantStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Alert.displayName = "Alert";

export const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', ...props }, ref) => (
    <h5
      ref={ref}
      className={`mb-1 font-semibold leading-none tracking-tight text-esg-dark ${className}`}
      {...props}
    />
  )
);
AlertTitle.displayName = "AlertTitle";

export const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`text-xs text-esg-muted leading-relaxed [&_p]:leading-relaxed ${className}`}
      {...props}
    />
  )
);
AlertDescription.displayName = "AlertDescription";
