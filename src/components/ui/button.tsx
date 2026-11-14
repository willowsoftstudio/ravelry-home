import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Variants follow design-system/ravelry-companion-site/MASTER.md Component Specs:
// primary = green CTA, secondary = terracotta outline. Every size keeps a
// 44x44px minimum target (ISA ISC-13) and a solid 2px focus ring (ISC-56).
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-clip-padding font-semibold whitespace-nowrap transition-[background-color,color,border-color,opacity,transform,box-shadow] duration-200 ease-out outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: "bg-cta text-cta-foreground shadow-(--shadow-raised) hover:opacity-90 active:translate-y-px",
        secondary:
          "border border-primary bg-transparent text-primary hover:bg-muted active:translate-y-px",
        outline:
          "border-border bg-card text-foreground shadow-(--shadow-raised) hover:border-input hover:bg-muted active:translate-y-px aria-expanded:bg-muted aria-pressed:border-transparent",
        ghost: "text-foreground hover:bg-muted aria-expanded:bg-muted",
        destructive:
          "bg-destructive text-destructive-foreground shadow-(--shadow-raised) hover:opacity-90 active:translate-y-px",
        link: "text-primary underline underline-offset-4 hover:no-underline",
      },
      size: {
        default: "min-h-11 px-4 text-sm sm:min-h-10",
        sm: "min-h-11 px-3 text-sm sm:min-h-9",
        lg: "min-h-12 px-6 text-base",
        icon: "size-11",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
