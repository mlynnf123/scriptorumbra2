import React, { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";

interface IOSDropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
  triggerClassName?: string;
}

export function IOSDropdownMenu({ 
  trigger, 
  children, 
  align = "start", 
  className,
  triggerClassName 
}: IOSDropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Use both mouse and touch events for better iOS support
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={cn(
          "touch-manipulation cursor-pointer",
          triggerClassName
        )}
        onClick={handleToggle}
        onTouchEnd={Capacitor.isNativePlatform() ? handleToggle : undefined}
        style={{
          WebkitTapHighlightColor: "transparent",
          WebkitTouchCallout: "none",
          WebkitUserSelect: "none",
          userSelect: "none"
        }}
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            "absolute mt-2 rounded-md shadow-lg bg-white dark:bg-gray-800",
            "ring-1 ring-black ring-opacity-5 z-50",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2",
            align === "end" && "right-0",
            align === "center" && "left-1/2 -translate-x-1/2",
            align === "start" && "left-0",
            className
          )}
        >
          <div 
            className="py-1" 
            role="menu" 
            aria-orientation="vertical"
            onClick={() => setIsOpen(false)}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export function IOSDropdownMenuItem({ 
  children, 
  onClick, 
  className,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { onClick?: () => void }) {
  return (
    <div
      className={cn(
        "px-4 py-2 text-sm cursor-pointer",
        "hover:bg-gray-100 dark:hover:bg-gray-700",
        "flex items-center",
        "touch-manipulation",
        className
      )}
      role="menuitem"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick?.();
      }}
      onTouchEnd={Capacitor.isNativePlatform() ? (e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick?.();
      } : undefined}
      style={{
        WebkitTapHighlightColor: "transparent",
        WebkitTouchCallout: "none"
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function IOSDropdownMenuSeparator() {
  return <div className="h-px my-1 bg-gray-200 dark:bg-gray-700" />;
}