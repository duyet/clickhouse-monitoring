"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, Menu } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar:state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }

  return context
}

interface SidebarProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const SidebarProvider = React.forwardRef<HTMLDivElement, SidebarProviderProps>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: onOpenChangeProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = React.useState(false)

    // Get open state from cookie or use prop/default
    const [open, setOpen] = React.useState(defaultOpen)
    React.useEffect(() => {
      if (typeof window === "undefined") return
      const stored = localStorage.getItem(SIDEBAR_COOKIE_NAME)
      if (stored !== null) {
        setOpen(JSON.parse(stored))
      }
    }, [])

    const handleSetOpen = React.useCallback(
      (value: boolean) => {
        setOpen(value)
        if (typeof window !== "undefined") {
          localStorage.setItem(SIDEBAR_COOKIE_NAME, JSON.stringify(value))
        }
        onOpenChangeProp?.(value)
      },
      [onOpenChangeProp]
    )

    // Allow controlled open state
    const openState = openProp !== undefined ? openProp : open
    const toggleSidebar = React.useCallback(() => {
      if (isMobile) {
        setOpenMobile(!openMobile)
      } else {
        handleSetOpen(!openState)
      }
    }, [isMobile, openMobile, openState, handleSetOpen])

    // Handle keyboard shortcut
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key.toLowerCase() === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault()
          toggleSidebar()
        }
      }

      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])

    return (
      <SidebarContext.Provider
        value={{
          state: openState ? "expanded" : "collapsed",
          open: openState,
          setOpen: handleSetOpen,
          openMobile,
          setOpenMobile,
          isMobile,
          toggleSidebar,
        }}
      >
        <div
          ref={ref}
          className={cn(
            "flex h-full w-full flex-col overflow-hidden",
            className
          )}
          style={
            {
              "--sidebar-width": "16rem",
              ...style,
            } as React.CSSProperties
          }
          {...props}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
      ...props
    },
    ref
  ) => {
    const { isMobile, openMobile, setOpenMobile } = useSidebar()

    if (collapsible === "none") {
      return (
        <div
          ref={ref}
          className={cn(
            "flex h-full w-[var(--sidebar-width)] flex-col bg-sidebar text-sidebar-foreground",
            className
          )}
          {...props}
        />
      )
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <SheetContent side={side} className="w-[var(--sidebar-width)] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden">
            <div
              ref={ref}
              className={cn(
                "flex h-full w-[var(--sidebar-width)] flex-col bg-sidebar text-sidebar-foreground",
                className
              )}
              {...props}
            />
          </SheetContent>
        </Sheet>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          "group/sidebar flex h-full w-[var(--sidebar-width)] flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-in-out data-[state=collapsed]:w-[calc(var(--sidebar-width)_-_3rem)]",
          variant === "inset" && "border-r",
          className
        )}
        {...props}
      />
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn("h-9 w-9", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <Menu className="h-4 w-4" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      ref={ref}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "absolute right-0 top-1/2 z-20 hidden -translate-y-1/2 translate-x-1/2 rounded-full p-1.5 text-sidebar-foreground/50 opacity-0 shadow-md transition-all hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 group-hover/sidebar:opacity-100 after:absolute after:inset-0 after:z-[-1] after:rounded-full",
        "md:flex",
        className
      )}
      {...props}
    >
      <ChevronRight className="h-4 w-4" />
      <span className="sr-only">Toggle Sidebar</span>
    </button>
  )
})
SidebarRail.displayName = "SidebarRail"

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex min-h-svh w-full flex-col bg-background",
      className
    )}
    {...props}
  />
))
SidebarInset.displayName = "SidebarInset"

const SidebarInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentPropsWithoutRef<typeof Input>
>(({ className, ...props }, ref) => (
  <Input
    ref={ref}
    className={cn(
      "h-8 w-full bg-background px-2 text-xs shadow-none placeholder:text-sidebar-foreground/40",
      className
    )}
    {...props}
  />
))
SidebarInput.displayName = "SidebarInput"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-2 px-4 py-3", className)}
    {...props}
  />
))
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-2 border-t px-4 py-3", className)}
    {...props}
  />
))
SidebarFooter.displayName = "SidebarFooter"

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentPropsWithoutRef<typeof Separator>
>(({ className, ...props }, ref) => (
  <Separator
    ref={ref}
    className={cn("mx-2 bg-sidebar-border", className)}
    {...props}
  />
))
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex min-h-0 flex-1 flex-col overflow-auto group-data-[collapsible=icon]/sidebar:overflow-hidden",
      className
    )}
    {...props}
  />
))
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative flex w-full min-w-0 flex-col overflow-hidden p-2", className)}
    {...props}
  />
))
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      ref={ref}
      className={cn(
        "px-2 py-1.5 text-xs font-medium text-sidebar-foreground/70 transition-[margin,opa] duration-200 ease-linear group-data-[collapsible=icon]/sidebar:-mt-8 group-data-[collapsible=icon]/sidebar:opacity-0",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean
  }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      className={cn(
        "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground/60 outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 group-data-[collapsible=icon]/sidebar:hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupAction.displayName = "SidebarGroupAction"

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-full text-sm", className)}
    {...props}
  />
))
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex w-full min-w-0 flex-col gap-1", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("group/menu-item relative", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

interface SidebarMenuButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  isActive?: boolean
  tooltip?: string | React.ComponentProps<typeof TooltipContent>
  size?: "sm" | "default"
}

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  SidebarMenuButtonProps
>(
  (
    {
      asChild = false,
      isActive = false,
      tooltip,
      size = "default",
      className,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const { state } = useSidebar()

    const button = (
      <Comp
        ref={ref}
        className={cn(
          "peer/menu-button relative flex w-full items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 text-left text-sm outline-none transition-[width,height,padding] focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 group-data-[collapsible=icon]/sidebar:h-10 group-data-[collapsible=icon]/sidebar:w-10 group-data-[collapsible=icon]/sidebar:p-0 aria-disabled:pointer-events-none aria-disabled:opacity-50",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive &&
            "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
          size === "sm" && "text-xs py-1",
          size === "default" && "text-sm",
          className
        )}
        {...props}
      />
    )

    if (!tooltip) {
      return button
    }

    if (state !== "collapsed") {
      return button
    }

    const tooltipProps =
      typeof tooltip === "string" ? { children: tooltip } : tooltip

    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right" {...tooltipProps} />
        </Tooltip>
      </TooltipProvider>
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean
    showOnHover?: boolean
  }
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      className={cn(
        "absolute right-1.5 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md text-sidebar-foreground/60 outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-foreground [&>svg]:size-4",
        showOnHover &&
          "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[pressed=true]/menu-button:opacity-100 opacity-0",
        "group-data-[collapsible=icon]/sidebar:right-1.5",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuAction.displayName = "SidebarMenuAction"

const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute right-1 top-1.5 flex items-center justify-center rounded-md px-1 text-xs font-medium text-sidebar-foreground pointer-events-none",
      className
    )}
    {...props}
  />
))
SidebarMenuBadge.displayName = "SidebarMenuBadge"

const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    showIcon?: boolean
  }
>(({ className, showIcon = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex h-8 w-full items-center gap-2 rounded-md px-2", className)}
    {...props}
  >
    {showIcon && <Skeleton className="h-4 w-4 rounded-md" />}
    <Skeleton className="h-4 w-full" />
  </div>
))
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton"

const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn(
      "border-l border-sidebar-border px-2 py-0.5 ml-3.5 flex flex-col gap-1",
      "group-data-[collapsible=icon]/sidebar:hidden",
      className
    )}
    {...props}
  />
))
SidebarMenuSub.displayName = "SidebarMenuSub"

const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={className} {...props} />
))
SidebarMenuSubItem.displayName = "SidebarMenuSubItem"

interface SidebarMenuSubButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  isActive?: boolean
  size?: "sm" | "default"
}

const SidebarMenuSubButton = React.forwardRef<
  HTMLButtonElement,
  SidebarMenuSubButtonProps
>(({ asChild = false, isActive = false, size = "default", className, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      className={cn(
        "relative flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm outline-none transition-colors focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
        size === "sm" && "text-xs py-1",
        size === "default" && "text-sm",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
