import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive';
  className?: string;
}

export const Alert = ({ children, variant = 'default', className }: AlertProps) => {
  const variantClasses = variant === 'destructive' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700';
  return (
    <div className={`p-4 rounded-md ${variantClasses} ${className}`}>
      {children}
    </div>
  );
};

export const AlertDescription = ({ children }: { children: React.ReactNode }) => {
  return <p className="text-sm">{children}</p>;
};