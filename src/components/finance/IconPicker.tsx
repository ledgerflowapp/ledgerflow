"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { FINANCIAL_ICONS } from "@/lib/constants/financial-icons";

interface IconPickerProps {
    value: string;
    onChange: (value: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger render={
                <Button variant="outline" className="w-full flex items-center justify-start gap-2 h-10 px-3">
                    <DynamicIcon name={value || "Wallet01Icon"} size={18} />
                    <span className="truncate">{value || "Select icon..."}</span>
                </Button>
            } />
            <PopoverContent className="w-[300px] p-2" align="start">
                <div className="grid grid-cols-6 gap-2 max-h-[300px] overflow-y-auto p-1">
                    {FINANCIAL_ICONS.map((iconName) => (
                        <button
                            key={iconName}
                            type="button"
                            className={`flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent transition-colors ${value === iconName ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
                            onClick={() => {
                                onChange(iconName);
                                setOpen(false);
                            }}
                            title={iconName}
                        >
                            <DynamicIcon name={iconName} size={20} />
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
