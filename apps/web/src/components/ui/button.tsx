import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none",
    "font-bold",
    "border-2 border-black",
    "transition-all",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    // Neo-brutal “lifted” default
    "shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
    // Hover: slight “inflate”
    "hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)]",
    // Active: “press in”
    "active:translate-x-[2px] active:translate-y-[2px] active:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
    "rounded-xl",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-white text-black",
        primary: "bg-yellow-300 text-black",
        secondary: "bg-neutral-100 text-black",
        destructive: "bg-red-400 text-black",
        ghost:
          "bg-transparent text-black shadow-none hover:translate-x-0 hover:translate-y-0 hover:shadow-none hover:bg-black hover:text-white active:shadow-none",
        outline:
          "bg-white text-black shadow-none hover:translate-x-0 hover:translate-y-0 hover:shadow-none hover:bg-neutral-50 active:shadow-none",
        link:
          "border-0 shadow-none bg-transparent p-0 h-auto rounded-none text-black underline-offset-4 hover:underline hover:translate-x-0 hover:translate-y-0 active:translate-x-0 active:translate-y-0",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        default: "h-11 px-5 text-base",
        lg: "h-12 px-7 text-lg",
        icon: "h-11 w-11 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
