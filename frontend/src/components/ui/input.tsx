// components/ui/input.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = 'text', ...props }, ref) => {
  // If parent passed `value` but not `onChange`, mark readOnly to avoid React warning.
  const readOnly = props.value !== undefined && props.onChange === undefined;

  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none',
        className
      )}
      readOnly={readOnly}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };
