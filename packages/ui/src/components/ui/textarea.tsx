import * as React from "react"

import { textareaControlClass } from "../../control-styles"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaControlClass(), className)}
      {...props}
    />
  )
}

export { Textarea }
