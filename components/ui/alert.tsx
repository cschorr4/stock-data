import React from 'react';
import { cn } from "@/lib/utils"; // Utility for class name merging
import { AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "success" | "info";
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const iconMap = {
      default: Info,
      destructive: AlertCircle,
      success: CheckCircle,
      info: Info,
    };

    const Icon = iconMap[variant] || Info;

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-start p-4 rounded-lg border space-x-3",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          {children}
        </div>
      </div>
    );
  }
);
Alert.displayName = "Alert";

export interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const AlertDescription = React.forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  )
);
AlertDescription.displayName = "AlertDescription";

// Styles for different alert variants
const variantStyles = {
  default: "bg-background border-border text-foreground",
  destructive: "bg-red-100 border-red-300 text-red-800",
  success: "bg-green-100 border-green-300 text-green-800",
  info: "bg-blue-100 border-blue-300 text-blue-800",
};

export default Alert;
