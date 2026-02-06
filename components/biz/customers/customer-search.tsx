'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { searchCustomers } from '@/app/(dashboard)/customers/actions'
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
import { User, Phone, CreditCard, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CustomerSearchResult {
  id: string
  full_name: string
  phone: string | null
  id_card_number: string | null
  id_card_type: string
}

interface CustomerSearchProps {
  value?: string
  onSelect: (customerId: string) => void
  placeholder?: string
  className?: string
}

export function CustomerSearch({
  value,
  onSelect,
  placeholder = 'Tìm kiếm khách hàng...',
  className
}: CustomerSearchProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CustomerSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Fetch customers when query changes
  const fetchCustomers = useCallback(async (searchQuery: string) => {
    setIsLoading(true)
    try {
      const customers = await searchCustomers(searchQuery, 10)
      setResults(customers)
    } catch (error) {
      console.error('Error searching customers:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      fetchCustomers(query)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, fetchCustomers])

  // Load initial customer if value is provided
  useEffect(() => {
    if (value && !selectedCustomer) {
      fetchCustomers(value)
    }
  }, [value, selectedCustomer, fetchCustomers])

  const handleSelect = useCallback((customer: CustomerSearchResult) => {
    setSelectedCustomer(customer)
    onSelect(customer.id)
    setOpen(false)
  }, [onSelect])

  const handleCreateNew = useCallback(() => {
    router.push('/customers/new')
  }, [router])

  const getIdCardTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      CMND: 'CMND',
      CCCD: 'CCCD',
      PASSPORT: 'Hộ chiếu',
      OTHER: 'Khác'
    }
    return labels[type] || type
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !selectedCustomer && "text-muted-foreground",
            className
          )}
        >
          {selectedCustomer ? (
            <div className="flex items-center gap-2 truncate">
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{selectedCustomer.full_name}</span>
              {selectedCustomer.phone && (
                <span className="text-muted-foreground text-sm">
                  ({selectedCustomer.phone})
                </span>
              )}
            </div>
          ) : (
            placeholder
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Nhập tên, số điện thoại hoặc CMND/CCCD..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="py-6 text-center text-sm">
                  <p className="text-muted-foreground">Không tìm thấy khách hàng</p>
                </div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {results.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.id}
                  onSelect={() => handleSelect(customer)}
                  className="cursor-pointer"
                >
                  <div className="flex items-start gap-3 py-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{customer.full_name}</p>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {customer.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </span>
                        )}
                        {customer.id_card_number && (
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {getIdCardTypeLabel(customer.id_card_type)}: {customer.id_card_number}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup>
              <CommandItem
                onSelect={handleCreateNew}
                className="cursor-pointer border-t"
              >
                <div className="flex items-center gap-2 py-1 text-primary">
                  <Plus className="h-4 w-4" />
                  <span className="font-medium">Thêm khách hàng mới</span>
                </div>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
