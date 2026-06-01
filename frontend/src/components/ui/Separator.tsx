import * as React from "react";

export const Separator: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  ...props
}) => (
  <div 
    className={`h-0.5 w-full bg-esg-moss/65 my-4 ${className}`} 
    {...props} 
  />
);
