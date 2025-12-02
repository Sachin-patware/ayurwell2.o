// components/RenderField.tsx (or above the page)
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type RenderFieldProps = {
  label: string;
  value: any;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  icon?: React.ComponentType<any>;
  placeholder?: string;
  isEditing: boolean;
};

function RenderFieldInner({ label, value, onChange, type = 'text', icon: Icon, placeholder, isEditing }: RenderFieldProps) {
  if (!isEditing) {
    return (
      <div className="space-y-1">
        <Label className="text-xs text-gray-500 uppercase tracking-wide">{label}</Label>
        <div className="flex items-center gap-2 text-gray-900 font-medium p-2 bg-gray-50/50 rounded-md border border-transparent">
          {Icon && <Icon className="w-4 h-4 text-gray-400" />}
          <span className="break-words">{value ?? <span className="text-gray-400 italic">Not provided</span>}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-2.5 text-gray-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <Input
          type={type}
          value={value ?? ''}
          onChange={onChange as any}
          className={Icon ? 'pl-9' : ''}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

export const RenderField = React.memo(RenderFieldInner);
