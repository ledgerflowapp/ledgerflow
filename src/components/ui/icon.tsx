import { HugeiconsIcon } from "@hugeicons/react";
import type { ComponentProps } from "react";

export function Icon({ icon, ...props }: ComponentProps<typeof HugeiconsIcon>) {
  return <HugeiconsIcon icon={icon} {...props} />;
}
