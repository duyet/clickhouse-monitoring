'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface RememberMeCheckboxProps {
  /**
   * Whether the checkbox is checked
   */
  checked: boolean
  /**
   * Callback when checkbox state changes
   */
  onCheckedChange: (checked: boolean) => void
  /**
   * Whether the checkbox is disabled
   */
  disabled?: boolean
  /**
   * Optional className for styling
   */
  className?: string
}

/**
 * Remember Me Checkbox Component
 *
 * A styled checkbox for the "Remember Me" option on login forms.
 * When checked, the session will not expire until explicit logout.
 */
export function RememberMeCheckbox({
  checked,
  onCheckedChange,
  disabled = false,
  className,
}: RememberMeCheckboxProps) {
  return (
    <div className={`flex items-center space-x-2 ${className || ''}`}>
      <Checkbox
        id="remember-me"
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        disabled={disabled}
      />
      <Label
        htmlFor="remember-me"
        className="text-sm font-normal text-muted-foreground cursor-pointer"
      >
        Remember me
      </Label>
    </div>
  )
}
