import * as React from 'react';
import { cn } from '@/lib/utils';

interface PopoverProps {
  children: React.ReactNode;
}

interface PopoverContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

const PopoverContext = React.createContext<PopoverContextType | undefined>(undefined);

export function Popover({ children }: PopoverProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block">
        {children}
      </div>
    </PopoverContext.Provider>
  );
}

export const PopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ children, asChild, ...props }, ref) => {
  const context = React.useContext(PopoverContext);
  if (!context) throw new Error('PopoverTrigger must be used within Popover');

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    context.setOpen(!context.open);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as any, {
      ref: context.triggerRef,
      onClick: handleClick,
      ...props,
    });
  }

  return (
    <button ref={context.triggerRef} onClick={handleClick} {...props}>
      {children}
    </button>
  );
});

PopoverTrigger.displayName = 'PopoverTrigger';

export const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const context = React.useContext(PopoverContext);
  if (!context) throw new Error('PopoverContent must be used within Popover');

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        context.triggerRef.current &&
        !context.triggerRef.current.contains(event.target as Node) &&
        ref &&
        'current' in ref &&
        ref.current &&
        !ref.current.contains(event.target as Node)
      ) {
        context.setOpen(false);
      }
    };

    if (context.open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [context, ref]);

  if (!context.open) return null;

  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 mt-2 w-auto rounded-md border bg-white p-4 text-gray-900 shadow-md outline-none',
        className
      )}
      {...props}
    />
  );
});

PopoverContent.displayName = 'PopoverContent';