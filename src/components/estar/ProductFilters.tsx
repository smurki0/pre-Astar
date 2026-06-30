'use client'

import { useState, useEffect } from 'react'
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { csrfFetch } from '@/lib/csrf-fetch'

export interface FilterState {
  categories: string[]
  priceRange: [number, number]
  sizes: string[]
  colors: string[]
  sort: string
}

interface ProductFiltersProps {
  onFilterChange?: (filters: FilterState) => void
  initialCategory?: string
  className?: string
}

interface Category {
  id: string
  nameEn: string
  nameAr: string
  slug: string
}

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

const colors = [
  { id: 'black', name: 'أسود', hex: '#1a1a1a' },
  { id: 'white', name: 'أبيض', hex: '#ffffff' },
  { id: 'beige', name: 'بيج', hex: '#f5e6d3' },
  { id: 'pink', name: 'وردي', hex: '#f8bbd9' },
  { id: 'rose', name: 'روز', hex: '#e8a0a0' },
  { id: 'lavender', name: 'لافندر', hex: '#e6e6fa' },
  { id: 'sage', name: 'مريمي', hex: '#9dc183' },
  { id: 'navy', name: 'كحلي', hex: '#1a365d' },
]

const sortOptions = [
  { value: 'newest', label: 'الأحدث' },
  { value: 'price-asc', label: 'السعر: من الأقل للأعلى' },
  { value: 'price-desc', label: 'السعر: من الأعلى للأقل' },
  { value: 'popular', label: 'الأكثر مبيعاً' },
  { value: 'rating', label: 'التقييم' },
]

const defaultFilters: FilterState = {
  categories: [],
  priceRange: [0, 10000],
  sizes: [],
  colors: [],
  sort: 'newest',
}

// FilterContent component defined outside to avoid lint errors
interface FilterContentProps {
  filters: FilterState
  expandedSections: Record<string, boolean>
  categories: Category[]
  onToggleSection: (section: string) => void
  onCategoryChange: (categoryId: string, checked: boolean) => void
  onPriceChange: (value: number[]) => void
  onSizeClick: (size: string) => void
  onColorClick: (colorId: string) => void
  onSortChange: (value: string) => void
  onClearFilters: () => void
  activeFiltersCount: number
}

function FilterContent({
  filters,
  expandedSections,
  categories,
  onToggleSection,
  onCategoryChange,
  onPriceChange,
  onSizeClick,
  onColorClick,
  onSortChange,
  onClearFilters,
  activeFiltersCount,
}: FilterContentProps) {
  return (
    <div className="space-y-6">
      {/* Sort */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">الترتيب</h4>
        <Select value={filters.sort} onValueChange={onSortChange}>
          <SelectTrigger className="w-full border-border focus:border-primary">
            <SelectValue placeholder="اختر الترتيب" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Categories */}
      <div className="space-y-3">
        <button
          type="button"
          className="flex items-center justify-between w-full text-sm font-medium text-foreground"
          onClick={() => onToggleSection('category')}
        >
          الفئات
          {expandedSections.category ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.category && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد فئات</p>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={filters.categories.includes(category.id)}
                    onCheckedChange={(checked) =>
                      onCategoryChange(category.id, checked as boolean)
                    }
                    className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label
                    htmlFor={`category-${category.id}`}
                    className="text-sm text-muted-foreground cursor-pointer flex items-center gap-2"
                  >
                    {category.nameAr}
                    <span className="text-muted-foreground/60 text-xs">({category.nameEn})</span>
                  </Label>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* Price Range */}
      <div className="space-y-3">
        <button
          type="button"
          className="flex items-center justify-between w-full text-sm font-medium text-foreground"
          onClick={() => onToggleSection('price')}
        >
          نطاق السعر
          {expandedSections.price ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.price && (
          <div className="space-y-4">
            <Slider
              min={0}
              max={10000}
              step={100}
              value={[filters.priceRange[0], filters.priceRange[1]]}
              onValueChange={onPriceChange}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{filters.priceRange[0]} ج.م</span>
              <span>{filters.priceRange[1]} ج.م</span>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Sizes */}
      <div className="space-y-3">
        <button
          type="button"
          className="flex items-center justify-between w-full text-sm font-medium text-foreground"
          onClick={() => onToggleSection('size')}
        >
          المقاسات
          {expandedSections.size ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.size && (
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <Button
                key={size}
                variant={filters.sizes.includes(size) ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSizeClick(size)}
                className={cn(
                  'w-12 h-10 p-0 font-medium transition-all',
                  filters.sizes.includes(size)
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                )}
              >
                {size}
              </Button>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Colors */}
      <div className="space-y-3">
        <button
          type="button"
          className="flex items-center justify-between w-full text-sm font-medium text-foreground"
          onClick={() => onToggleSection('color')}
        >
          الألوان
          {expandedSections.color ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.color && (
          <div className="flex flex-wrap gap-3">
            {colors.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => onColorClick(color.id)}
                className={cn(
                  'w-8 h-8 rounded-full border-2 transition-all relative',
                  filters.colors.includes(color.id)
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-border hover:border-primary/50'
                )}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              >
                {filters.colors.includes(color.id) && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        color.id === 'white' ? 'bg-primary' : 'bg-white'
                      )}
                    />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="w-full border-border text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary"
        >
          <X className="h-4 w-4 mr-2" />
          مسح الفلاتر ({activeFiltersCount})
        </Button>
      )}
    </div>
  )
}

export function ProductFilters({ onFilterChange, initialCategory, className }: ProductFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(() => ({
    ...defaultFilters,
    categories: initialCategory ? [initialCategory] : [],
  }))
  const [categories, setCategories] = useState<Category[]>([])
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    category: true,
    price: true,
    size: true,
    color: true,
  })

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await csrfFetch('/api/categories')
        if (response.ok) {
          const data = await response.json()
          setCategories(data.map((cat: Category) => ({
            id: cat.id,
            nameEn: cat.nameEn,
            nameAr: cat.nameAr,
            slug: cat.slug,
          })))
        }
      } catch (error) {
        // Handle error silently
      }
    }
    fetchCategories()
  }, [])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.categories, categoryId]
      : filters.categories.filter((c) => c !== categoryId)
    const newFilters = { ...filters, categories: newCategories }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const handlePriceChange = (value: number[]) => {
    const newFilters = { ...filters, priceRange: [value[0], value[1]] as [number, number] }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const handleSizeClick = (size: string) => {
    const newSizes = filters.sizes.includes(size)
      ? filters.sizes.filter((s) => s !== size)
      : [...filters.sizes, size]
    const newFilters = { ...filters, sizes: newSizes }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const handleColorClick = (colorId: string) => {
    const newColors = filters.colors.includes(colorId)
      ? filters.colors.filter((c) => c !== colorId)
      : [...filters.colors, colorId]
    const newFilters = { ...filters, colors: newColors }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const handleSortChange = (value: string) => {
    const newFilters = { ...filters, sort: value }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const clearFilters = () => {
    setFilters(defaultFilters)
    onFilterChange?.(defaultFilters)
  }

  const activeFiltersCount =
    filters.categories.length +
    filters.sizes.length +
    filters.colors.length +
    (filters.priceRange[0] !== 0 || filters.priceRange[1] !== 10000 ? 1 : 0)

  return (
    <div className={cn('', className)}>
      {/* Desktop Filters */}
      <div className="hidden lg:block">
        <div className="bg-background rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">الفلاتر</h3>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          <FilterContent
            filters={filters}
            expandedSections={expandedSections}
            categories={categories}
            onToggleSection={toggleSection}
            onCategoryChange={handleCategoryChange}
            onPriceChange={handlePriceChange}
            onSizeClick={handleSizeClick}
            onColorClick={handleColorClick}
            onSortChange={handleSortChange}
            onClearFilters={clearFilters}
            activeFiltersCount={activeFiltersCount}
          />
        </div>
      </div>

      {/* Mobile Filters */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="w-full border-border text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              الفلاتر
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 bg-primary text-primary-foreground">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 border-l-border">
            <SheetHeader>
              <SheetTitle className="text-foreground">الفلاتر</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
              <FilterContent
                filters={filters}
                expandedSections={expandedSections}
                categories={categories}
                onToggleSection={toggleSection}
                onCategoryChange={handleCategoryChange}
                onPriceChange={handlePriceChange}
                onSizeClick={handleSizeClick}
                onColorClick={handleColorClick}
                onSortChange={handleSortChange}
                onClearFilters={clearFilters}
                activeFiltersCount={activeFiltersCount}
              />
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
