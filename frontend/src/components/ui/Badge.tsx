import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'approved' | 'pending' | 'rejected' | 'anomaly' | 'scope1' | 'scope2' | 'scope3';
}

export const Badge: React.FC<BadgeProps> = ({ 
  className = '', 
  variant = 'default', 
  ...props 
}) => {
  let baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-colors duration-150 border border-transparent";
  let variantStyles = "";

  switch (variant) {
    case 'default':
      variantStyles = "bg-esg-sage text-esg-dark";
      break;
    case 'secondary':
      variantStyles = "bg-esg-moss text-esg-text";
      break;
    case 'outline':
      variantStyles = "border-esg-border text-esg-text";
      break;
    case 'approved':
      variantStyles = "bg-emerald-50/20 text-emerald-800/65 border border-emerald-200/40";
      break;
    case 'pending':
      variantStyles = "bg-amber-50/20 text-amber-800/65 border border-amber-200/40";
      break;
    case 'rejected':
      variantStyles = "bg-rose-50/20 text-rose-800/65 border border-rose-200/40";
      break;
    case 'anomaly':
      variantStyles = "bg-rose-50/40 text-rose-700/60 border border-rose-200/40 animate-pulse";
      break;
    case 'scope1':
      variantStyles = "bg-esg-sage text-esg-dark font-medium shadow-sm";
      break;
    case 'scope2':
      variantStyles = "bg-esg-moss text-esg-text font-medium border border-esg-border/60";
      break;
    case 'scope3':
      variantStyles = "bg-esg-sand text-white font-medium shadow-sm";
      break;
  }

  return (
    <span
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...props}
    />
  );
};
