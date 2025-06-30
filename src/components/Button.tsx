// src/components/Button.tsx
import { cva, type VariantProps } from 'cva';
import type { ButtonHTMLAttributes, FC } from 'react';

// Define all your button styles here, directly in the component file.
// This is where you use your Tailwind classes.
const buttonStyles = cva(
  // Base classes that apply to all variants
  'flex items-center justify-center font-semibold rounded-md transition-colors',
  {
    variants: {
      intent: {
        primary: 'bg-blue-500 text-white hover:bg-blue-600',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
      },
      size: {
        small: 'px-2 py-1 text-sm',
        medium: 'px-4 py-2 text-base',
      },
    },
    // Default variants if none are specified
    defaultVariants: {
      intent: 'primary',
      size: 'medium',
    },
  }
);

// Define the props for your component
interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {}

// Create the component
const Button: FC<ButtonProps> = ({ className, intent, size, ...props }) => {
  return <button className={buttonStyles({ intent, size, className })} {...props} />;
};

export default Button;