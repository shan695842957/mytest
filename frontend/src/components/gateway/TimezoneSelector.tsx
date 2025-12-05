/**
 * 时区选择器组件
 * 基于 Command组件实现，支持搜索和分组
 */
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Check, ChevronsUpDown, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

import { getTimezones } from '@/api/gateway'

interface TimezoneSelectorProps {
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
}

export function TimezoneSelector({ value, onValueChange, disabled }: TimezoneSelectorProps) {
  const { t } = useTranslation(['gateway', 'common'])
  const [open, setOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['gateway', 'timezones'],
    queryFn: getTimezones,
    staleTime: Infinity, // 时区列表不会变化，永久缓存
  })

  const grouped = data?.data?.grouped || []
  const timezones = data?.data?.timezones || []

  // 查找当前选中的时区显示名称
  const selectedTimezone = timezones.find(tz => tz.name === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-mono"
          disabled={disabled}
        >
          {selectedTimezone ? (
            <span className="truncate">{selectedTimezone.display}</span>
          ) : (
            <span className="text-muted-foreground">{t('gateway:time.selectTimezone')}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command>
          <CommandInput placeholder={t('gateway:time.searchTimezone')} className="h-9" />
          <CommandEmpty>{t('gateway:time.noTimezoneFound')}</CommandEmpty>
          <CommandList className="max-h-[400px]">
            {grouped.map((group) => (
              <CommandGroup key={group.continent} heading={group.continent}>
                {group.timezones.map((tz) => (
                  <CommandItem
                    key={tz.name}
                    value={tz.display}
                    onSelect={() => {
                      onValueChange(tz.name)
                      setOpen(false)
                    }}
                    className="font-mono text-sm"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === tz.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="flex-1 truncate">{tz.display}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

