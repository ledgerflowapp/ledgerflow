import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import * as HugeIcons from "@hugeicons/core-free-icons";
import { IconBaseProps } from "react-icons";
import * as ReactIcons from "react-icons/fi"; // fallback

interface DynamicIconProps extends Omit<React.ComponentProps<typeof HugeiconsIcon>, "icon"> {
  name: string;
  className?: string;
  size?: number;
}

export function DynamicIcon({ name, className, size = 24, ...props }: DynamicIconProps) {
  // Try HugeIcons first
  const IconComponent = (HugeIcons as any)[name];
  
  if (IconComponent) {
    return <HugeiconsIcon icon={IconComponent} className={className} size={size} {...props} />;
  }

  // Fallback to react-icons (Feather)
  const FallbackIcon = (ReactIcons as any)[name];
  if (FallbackIcon) {
    return <FallbackIcon className={className} size={size} {...(props as any)} />;
  }

  // Default fallback
  const DefaultIcon = (HugeIcons as any)["HelpCircleIcon"] || (ReactIcons as any)["FiHelpCircle"];
  if (DefaultIcon && (HugeIcons as any)["HelpCircleIcon"]) {
      return <HugeiconsIcon icon={DefaultIcon} className={className} size={size} {...props} />;
  } else if (DefaultIcon) {
      return <DefaultIcon className={className} size={size} {...(props as any)} />;
  }
  return null;
}
