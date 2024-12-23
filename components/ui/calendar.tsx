"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CalendarBaseProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: boolean
  fromDate?: Date
  toDate?: Date
  showOutsideDays?: boolean
}

export type CalendarProps = CalendarBaseProps & Omit<React.HTMLAttributes<HTMLDivElement>, keyof CalendarBaseProps>

function Calendar({
  className,
  selected,
  onSelect,
  disabled,
  fromDate,
  toDate,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(selected || new Date())

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleDateSelect = (day: number) => {
    if (disabled) return
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    
    // Check if date is within allowed range
    if (fromDate && newDate < fromDate) return
    if (toDate && newDate > toDate) return
    
    onSelect?.(newDate)
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Add empty cells for days before the first day of the month
    if (showOutsideDays) {
      for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="w-9 h-9" />)
      }
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const isSelected = selected && 
        selected.getDate() === day && 
        selected.getMonth() === currentDate.getMonth() &&
        selected.getFullYear() === currentDate.getFullYear()
      
      const isToday = new Date().toDateString() === date.toDateString()
      const isDisabled = (fromDate && date < fromDate) || (toDate && date > toDate)

      days.push(
        <Button
          key={day}
          onClick={() => handleDateSelect(day)}
          disabled={disabled || isDisabled}
          className={cn(
            "w-9 h-9 p-0 font-normal",
            isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            isToday && !isSelected && "bg-accent text-accent-foreground",
            !isSelected && !isToday && "hover:bg-accent hover:text-accent-foreground",
          )}
        >
          {day}
        </Button>
      )
    }

    return days
  }

  return (
    <div className={cn("p-3", className)} {...props}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className={cn(
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
              "absolute left-1"
            )}
            onClick={handlePrevMonth}
            disabled={disabled}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="font-medium text-sm">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>

          <Button
            variant="ghost"
            className={cn(
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
              "absolute right-1"
            )}
            onClick={handleNextMonth}
            disabled={disabled}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-xs font-medium">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-center text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {renderCalendarDays()}
        </div>
      </div>
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }