
import React from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showOnlineIndicator?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-3xl'
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  className = '',
  showOnlineIndicator = false
}) => {
  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const baseClasses = `${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold relative ${className}`;

  if (src) {
    return (
      <div className={`${baseClasses} overflow-hidden ring-2 ring-white shadow-lg`}>
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback si la imagen falla
            e.currentTarget.style.display = 'none';
          }}
        />
        {showOnlineIndicator && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
        )}
      </div>
    );
  }

  // Gradientes aleatorios basados en el nombre
  const gradients = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-teal-500 to-blue-500',
  ];

  const gradientIndex = name ? name.charCodeAt(0) % gradients.length : 0;
  const gradient = gradients[gradientIndex];

  return (
    <div className={`${baseClasses} bg-gradient-to-br ${gradient} text-white shadow-lg ring-2 ring-white`}>
      {name ? getInitials(name) : <User size={size === 'xs' ? 12 : size === 'sm' ? 16 : 20} />}
      {showOnlineIndicator && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
      )}
    </div>
  );
};
