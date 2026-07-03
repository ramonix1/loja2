import * as React from "react"

import { inputControlClass } from "../../control-styles"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputControlClass(), className)}
      {...props}
    />
  )
}

export { Input }
