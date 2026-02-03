import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Info,
  Pencil,
  Plus,
  Redo2,
  Sparkles,
  Trash2,
  Undo2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatLabel, getNestedValue } from 'tanstack-effect'
import type {
  FormBuilderProps,
  FormFieldDefinition,
  FormFieldProps as BaseFormFieldProps,
  NestedFormProps,
  UseSchemaFormReturn,
} from 'tanstack-effect/client'

import { ChatView } from './chat-view'

/**
 * Field metadata returned by the resolver
 */
export interface FieldMeta {
  label?: string
  description?: string
}

/**
 * Check if a field is currently required (either statically or conditionally)
 */
function isFieldCurrentlyRequired(field: FormFieldDefinition, formData: any): boolean {
  // Check static requirement
  if (field.required) {
    return true
  }

  // Check conditional requirement
  if (field.requiredWhen) {
    const { field: conditionField, value: expectedValue, notValue } = field.requiredWhen
    const actualValue = getNestedValue(formData, conditionField)

    // Support both "equals" (value) and "not equals" (notValue) conditions
    if (expectedValue !== undefined) {
      return actualValue === expectedValue
    }
    if (notValue !== undefined) {
      return actualValue !== notValue
    }
  }

  return false
}

/**
 * Field metadata resolver function type.
 * Used to dynamically resolve field labels and descriptions based on field path.
 * Common use cases: i18n translations, dynamic labels, context-aware descriptions.
 */
export type FieldMetaResolver = (fieldPath: string) => FieldMeta | undefined

/**
 * Form builder variants for different display densities
 * - default: Standard spacing and all features visible
 * - compact: Reduced spacing, sections collapsed by default, smaller text
 * - wizard: Step-by-step mode showing one section at a time with navigation
 */
export type FormBuilderVariant = 'default' | 'compact' | 'wizard'

/**
 * Extended FormFieldProps with optional overrides
 */
export interface FormFieldProps extends BaseFormFieldProps {
  /**
   * Optional custom options to override field.literalOptions.
   * Use this when you need to dynamically provide options based on context (e.g., chain).
   * When provided, this will be used instead of field.literalOptions for select fields.
   * @example
   * // Chain-specific paired token options
   * options={['ETH', 'USDC', 'DAI']}
   */
  options?: string[]
  /**
   * Optional label override. When provided, this will be used instead of field.label.
   */
  label?: string
  /**
   * Optional description override. When provided, this will be used instead of field.description.
   */
  description?: string
  /**
   * Optional field metadata resolver. When provided, this will be called with the field path
   * to get label and description. Used for nested fields in FormSection.
   * @example
   * // i18n translation resolver
   * getFieldMeta={(path) => ({ label: t(`fields.${path}.label`), description: t(`fields.${path}.description`) })}
   */
  getFieldMeta?: FieldMetaResolver
  /**
   * Full form data for evaluating conditional requirements (requiredWhen).
   * When provided, enables dynamic required indicator based on other field values.
   */
  formData?: any
}

import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { cn } from '../../utils'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Switch } from './ui/switch'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'

/**
 * Individual form field component
 */
export function FormField({
  field,
  value,
  onChange,
  error,
  minimal = false,
  options: customOptions,
  label: labelOverride,
  description: descriptionOverride,
  getFieldMeta,
  formData = {},
}: FormFieldProps) {
  const [showDescription, setShowDescription] = useState(true)

  // Get field metadata from resolver if provided
  const fieldMeta = getFieldMeta?.(field?.key || '')

  // Use overrides if provided, otherwise fall back to resolved metadata, then field values
  const displayLabel = labelOverride ?? fieldMeta?.label ?? field?.label
  const displayDescription = descriptionOverride ?? fieldMeta?.description ?? field?.description

  // Guard against undefined field
  if (!field) {
    return null
  }

  const I = minimal ? Input : Textarea

  // Determine if we should render as a select (either literal type or has custom options)
  const shouldRenderAsSelect =
    field.type === 'literal' || (field.type === 'string' && customOptions)
  const selectOptions = customOptions || field.literalOptions || []
  const optionDescriptions = field?.literalOptionsDescriptions || {}

  // Helper to get display label for an option
  const getOptionLabel = (option: any): string => {
    const optionKey = option?.toString() ?? ''
    return optionDescriptions[optionKey] || optionKey
  }

  const renderField = () => {
    // Handle custom options for string fields - render as select
    if (shouldRenderAsSelect && selectOptions.length > 0) {
      return (
        <div className="flex gap-2">
          <Select
            value={value?.toString() || ''}
            onValueChange={(selectedValue) => {
              // Handle clearing the value
              if (selectedValue === '__clear__') {
                onChange(undefined)
                return
              }
              // Find and set the exact option value from options
              const selectedOption = selectOptions.find(
                (option) => option?.toString() === selectedValue
              )
              // Always use the original option value to preserve type
              onChange(selectedOption !== undefined ? selectedOption : selectedValue)
            }}
          >
            <SelectTrigger className={cn('flex-1', error && 'border-red-500')}>
              <SelectValue placeholder="Select an option...">
                {value ? getOptionLabel(value) : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent position="item-aligned" className="h-max w-max">
              {!field.required && (
                <SelectItem value="__clear__" className="italic">
                  (None)
                </SelectItem>
              )}
              {selectOptions.map((option) => (
                <SelectItem key={option?.toString()} value={option?.toString()}>
                  {getOptionLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    switch (field.type) {
      case 'string':
        return (
          <I
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={cn(error && 'border-red-500')}
          />
        )

      case 'number':
        return (
          <Input
            type="text"
            inputMode="decimal"
            value={value === undefined || value === null || value === 0 ? '' : value}
            step={field.step}
            min={field.min}
            max={field.max}
            onChange={(e) => {
              const inputValue = e.target.value

              // Empty string means user wants to clear the field
              if (inputValue === '') {
                onChange(undefined)
                return
              }

              // Pass the raw input to the form hook for formatting and validation
              onChange(inputValue)
            }}
            onWheel={(e) => {
              e.currentTarget.blur()
            }}
            className={cn(error && 'border-red-500')}
          />
        )

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch checked={Boolean(value)} onCheckedChange={onChange} />
            <span className="text-muted-foreground text-sm">{value ? 'Enabled' : 'Disabled'}</span>
          </div>
        )

      case 'literal': {
        // This case is now handled above with shouldRenderAsSelect
        // Keeping for safety in case selectOptions is empty
        return null
      }

      default:
        return null
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex min-w-0 flex-1 items-start gap-2">
        <Label
          htmlFor={field.key}
          className={cn(
            'min-w-0 flex-1 text-xs sm:text-sm',
            isFieldCurrentlyRequired(field, formData) && 'font-semibold'
          )}
        >
          <span className="wrap-break-word">{displayLabel || formatLabel(field.key)}</span>
          {isFieldCurrentlyRequired(field, formData) ? (
            <span className="text-destructive">*</span>
          ) : field.type !== 'boolean' ? (
            <span className="text-muted-foreground ml-1 text-[10px]">(optional)</span>
          ) : null}
        </Label>
        {displayDescription && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto shrink-0 p-0 opacity-60 hover:opacity-100"
            onClick={() => setShowDescription(!showDescription)}
            tabIndex={-1}
            aria-label="Show description"
          >
            <Info className="h-3 w-3" />
          </Button>
        )}
      </div>

      {showDescription && displayDescription && (
        <p className="text-muted-foreground text-xs sm:text-sm">{displayDescription}</p>
      )}

      <div className="w-full">{renderField()}</div>

      {error && <div className="text-xs text-destructive sm:text-sm">{error}</div>}
    </div>
  )
}

/**
 * Helper function to check if a form is valid (including root-level errors)
 * This should be used instead of Object.keys(form.validationErrors).length === 0
 * Also checks for conditionally required fields (requiredWhen) that are missing
 */
export function isFormValid<T = any>(form: UseSchemaFormReturn<T>): boolean {
  // Check if there are any validation errors at all
  const hasErrors = Object.keys(form.validationErrors).length > 0
  // Also explicitly check for root error
  const hasRootError = !!form.validationErrors['_root']

  if (hasErrors || hasRootError) {
    return false
  }

  // Also check for missing required fields (including conditionally required)
  const missingFields = collectRequiredFields(form.fields, form.data)
  const hasMissingRequired = missingFields.some(({ key }) => {
    const value = getNestedValue(form.data, key)
    return value === undefined || value === null || value === ''
  })

  return !hasMissingRequired
}

/**
 * Helper to recursively collect all required fields from form schema
 */
function collectRequiredFields(
  fields: Record<string, FormFieldDefinition>,
  data: any
): Array<{ key: string; label: string }> {
  const required: Array<{ key: string; label: string }> = []

  Object.entries(fields).forEach(([, field]) => {
    if (!field) return

    // Skip fields with conditions that don't match current data
    if (field.condition) {
      const conditionValue = getNestedValue(data, field.condition.field)
      if (conditionValue !== field.condition.value) {
        return // Skip this field as its condition isn't met
      }
    }

    // Check if field is required (either statically or conditionally)
    let isCurrentlyRequired = field.required
    if (!isCurrentlyRequired && field.requiredWhen) {
      const actualValue = getNestedValue(data, field.requiredWhen.field)
      if (field.requiredWhen.value !== undefined) {
        isCurrentlyRequired = actualValue === field.requiredWhen.value
      } else if (field.requiredWhen.notValue !== undefined) {
        isCurrentlyRequired = actualValue !== field.requiredWhen.notValue
      }
    }

    // Add required non-object/array fields
    if (isCurrentlyRequired && field.type !== 'object' && field.type !== 'array') {
      required.push({
        key: field.key,
        label: field.label || formatLabel(field.key),
      })
    }

    // Recursively check children only if the parent field is not optional or has content
    if (field.children) {
      const fieldValue = getNestedValue(data, field.key)

      // For arrays: iterate through each item and collect required fields
      if (field.type === 'array') {
        const isArrayPopulated = Array.isArray(fieldValue) && fieldValue.length > 0
        if (!field.required && !isArrayPopulated) {
          return // Skip checking children of optional empty arrays
        }

        // For each item in the array, collect required fields with proper path
        if (Array.isArray(fieldValue)) {
          fieldValue.forEach((item, index) => {
            Object.entries(field.children || {}).forEach(([childKey, childField]) => {
              if (
                !childField ||
                !childField.required ||
                childField.type === 'object' ||
                childField.type === 'array'
              ) {
                return
              }
              // Build the full path with array index
              const fullPath = `${field.key}[${index}].${childKey}`
              required.push({
                key: fullPath,
                label: childField.label || formatLabel(childKey),
              })
            })
          })
        }
      }

      // For objects: only check children if object is required OR has content
      if (field.type === 'object') {
        const isObjectPopulated =
          fieldValue && typeof fieldValue === 'object' && Object.keys(fieldValue).length > 0
        if (!field.required && !isObjectPopulated) {
          return // Skip checking children of optional empty objects
        }

        const childRequired = collectRequiredFields(field.children, data)
        required.push(...childRequired)
      }
    }
  })

  return required
}

/**
 * Form validation status alert component
 */
export interface FormValidationAlertProps<T = any> {
  form: UseSchemaFormReturn<T>
  requiredFields?: Array<{ key: string; label: string }>
}

export function FormValidationAlert<T = any>({
  form,
  requiredFields,
}: FormValidationAlertProps<T>) {
  // Auto-collect required fields from schema if not provided
  const fieldsToCheck = requiredFields || collectRequiredFields(form.fields, form.data)

  // Check which required fields are missing
  const missingFields = fieldsToCheck.filter(({ key }) => {
    const value = getNestedValue(form.data, key)
    return !value || (typeof value === 'string' && value.trim() === '')
  })

  // Get root-level validation errors (from Schema.filter or general validation)
  const rootError = form.validationErrors['_root']

  const isValid = missingFields.length === 0 && !rootError

  return (
    <Alert>
      <AlertTitle>Form Validation</AlertTitle>
      <AlertDescription>
        {isValid ? (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            All required fields completed.
          </div>
        ) : (
          <div className="space-y-2">
            {missingFields.length > 0 && (
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                <span>
                  Please complete required fields:
                  {missingFields.map((field) => ` ${field.label}`).join(',')}
                </span>
              </div>
            )}
            {rootError && (
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
                <span>{rootError}</span>
              </div>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}

/**
 * Create default item for array fields
 */
export function createDefaultItem(children: Record<string, any>) {
  const defaultItem: any = {}
  Object.keys(children).forEach((key) => {
    const childField = children[key]
    switch (childField.type) {
      case 'string':
        defaultItem[key] = ''
        break
      case 'number':
        defaultItem[key] = 0
        break
      case 'boolean':
        defaultItem[key] = false
        break
      case 'object':
        defaultItem[key] = {}
        break
      case 'array':
        defaultItem[key] = []
        break
    }
  })
  return defaultItem
}

/**
 * Props for DiscriminatedUnionSection
 */
export interface DiscriminatedUnionSectionProps {
  field: FormFieldDefinition
  form: UseSchemaFormReturn<any>
  minimal?: boolean
  /**
   * Base path for the union (e.g., "fees")
   */
  basePath?: string
  /**
   * Optional label override
   */
  label?: string
  /**
   * Optional description override
   */
  description?: string
  /**
   * Optional field metadata resolver function
   */
  getFieldMeta?: FieldMetaResolver
}

/**
 * Discriminated union section component
 */
export function DiscriminatedUnionSection({
  field,
  form,
  minimal = false,
  basePath,
  label: labelOverride,
  description: descriptionOverride,
  getFieldMeta,
}: DiscriminatedUnionSectionProps) {
  // Guard against undefined field
  if (!field) return null
  if (!field.children) return null

  // Use base path or field key
  const sectionPath = basePath || field.key

  // Use overrides if provided, otherwise fall back to field values
  const displayLabel = labelOverride ?? field.label
  const displayDescription = descriptionOverride ?? field.description

  // Find the discriminant field (usually 'type')
  const discriminantEntry = Object.entries(field.children).find(
    ([, childField]) =>
      (childField as FormFieldDefinition).type === 'literal' &&
      !(childField as FormFieldDefinition).condition
  )

  if (!discriminantEntry) return null

  const [discriminantKey, discriminantField] = discriminantEntry as [string, FormFieldDefinition]
  const discriminantPath = discriminantKey

  // Get metadata for discriminant field
  const discriminantMetaPath = `${sectionPath}.${discriminantKey.split('.').pop()}`
  const discriminantMeta = getFieldMeta?.(discriminantMetaPath)

  // Get union type options and their fields
  const unionTypes = Object.entries(field.children)
    .filter(
      ([key, childField]) =>
        key !== discriminantKey && (childField as FormFieldDefinition).condition
    )
    .reduce(
      (acc, [, childField]) => {
        const condition = (childField as FormFieldDefinition).condition!
        if (!acc[condition.value]) {
          acc[condition.value] = []
        }
        acc[condition.value].push(childField as FormFieldDefinition)
        return acc
      },
      {} as Record<string, FormFieldDefinition[]>
    )

  const typeOptions = discriminantField.literalOptions || []
  const selectedType = getNestedValue(form.data, discriminantPath)

  const handleTypeChange = (newType: string) => {
    form.updateField(discriminantPath, newType)

    // Clear fields from other union variants
    Object.entries(field.children || {}).forEach(([key, childField]) => {
      const typedChildField = childField as FormFieldDefinition
      if (
        key !== discriminantKey &&
        typedChildField.condition &&
        typedChildField.condition.value !== newType
      ) {
        form.updateField(key, undefined)
      }
    })
  }

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <CardTitle className="text-sm sm:text-base">
          {displayLabel || formatLabel(field.key)}
          {displayDescription && (
            <p className="text-muted-foreground mt-2 text-xs sm:text-sm font-normal">
              {displayDescription}
            </p>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type Selection */}
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm font-semibold">
            {discriminantMeta?.label || discriminantField.label || formatLabel(discriminantKey)}
            {discriminantField.required && <span className="text-destructive">*</span>}
          </Label>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((option) => {
              const optionStr = String(option)

              return (
                <Button
                  key={optionStr}
                  type="button"
                  variant={selectedType === option ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTypeChange(optionStr)}
                  className="capitalize"
                >
                  {optionStr}
                </Button>
              )
            })}
          </div>
          {discriminantMeta?.description && (
            <p className="text-muted-foreground text-xs sm:text-sm border-l-2 border-primary pl-2">
              {discriminantMeta.description}
            </p>
          )}
          {!discriminantMeta?.description &&
            selectedType &&
            discriminantField.literalOptionsDescriptions?.[String(selectedType)] && (
              <p className="text-muted-foreground text-xs sm:text-sm border-l-2 border-primary pl-2">
                {discriminantField.literalOptionsDescriptions[String(selectedType)]}
              </p>
            )}
        </div>

        {/* Conditional Fields */}
        {selectedType && unionTypes[selectedType] && unionTypes[selectedType].length > 0 && (
          <div className="space-y-3">
            {unionTypes[selectedType].map((conditionalField) => {
              const fullPath = conditionalField.key
              const value = getNestedValue(form.data, fullPath)

              // Double-check the condition matches (safety check)
              if (conditionalField.condition && conditionalField.condition.value !== selectedType) {
                return null
              }

              // Get metadata for conditional field
              const fieldName = conditionalField.key.split('.').pop() || conditionalField.key
              const metaPath = `${sectionPath}.${fieldName}`
              const conditionalMeta = getFieldMeta?.(metaPath)

              return (
                <FormField
                  key={fullPath}
                  field={conditionalField}
                  value={value}
                  onChange={(value) => form.updateField(fullPath, value)}
                  error={form.validationErrors[fullPath]}
                  minimal={minimal}
                  label={conditionalMeta?.label}
                  description={conditionalMeta?.description}
                  getFieldMeta={getFieldMeta}
                  formData={form.data}
                />
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Extended NestedFormProps with optional label and description overrides
 */
export interface FormSectionProps<T = unknown> extends NestedFormProps<T> {
  /**
   * Optional label override. When provided, this will be used instead of field.label.
   */
  label?: string
  /**
   * Optional description override. When provided, this will be used instead of field.description.
   */
  description?: string
  /**
   * Optional field metadata resolver. When provided, this will be called with the field path
   * to get label and description for nested fields.
   */
  getFieldMeta?: FieldMetaResolver
  /**
   * Display variant for the section
   */
  variant?: FormBuilderVariant
  /**
   * If true, renders content without Card wrapper (flat mode)
   */
  flat?: boolean
}

/**
 * Recursive form section component for objects and arrays
 */
export function FormSection<T = unknown>({
  field,
  form,
  basePath,
  level = 0,
  initialCollapsed = false,
  minimal = false,
  label: labelOverride,
  description: descriptionOverride,
  getFieldMeta,
  variant = 'default',
  flat = false,
}: FormSectionProps<T>) {
  // Compact variant collapses sections at level > 0
  const defaultCollapsed = variant === 'compact' ? level > 0 : level > 2
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed || initialCollapsed)

  // Spacing classes based on variant
  const contentSpacing = variant === 'compact' ? 'space-y-2' : 'space-y-3'
  const cardPadding = variant === 'compact' ? 'p-2 sm:p-3' : 'p-3 sm:p-4'

  // Get field metadata from resolver if provided
  const sectionMeta = getFieldMeta?.(basePath || '')

  // Use overrides if provided, otherwise fall back to resolved metadata, then field values
  const displayLabel = labelOverride ?? sectionMeta?.label ?? field?.label
  const displayDescription = descriptionOverride ?? sectionMeta?.description ?? field?.description

  // Guard against undefined field
  if (!field) return null
  if (!field.children) return null

  // Check if this is a discriminated union (has children with conditions)
  const hasConditionalChildren = Object.values(field.children).some((child) => child.condition)
  if (hasConditionalChildren) {
    return (
      <DiscriminatedUnionSection
        field={field}
        form={form}
        minimal={minimal}
        basePath={basePath}
        label={displayLabel}
        description={displayDescription}
        getFieldMeta={getFieldMeta}
      />
    )
  }

  const sectionValue = getNestedValue(form.data, basePath) || (field.type === 'array' ? [] : {})
  const isArray = field.type === 'array'

  // Check if this is a primitive array (no children, or has literalOptions)
  const isPrimitiveArray = isArray && (!field.children || Object.keys(field.children).length === 0)
  const isLiteralArray = isArray && field.literalOptions && field.literalOptions.length > 0

  const addItem = () => {
    const newArray = [...(sectionValue as any[])]

    // For primitive/literal arrays, add a default primitive value
    if (isPrimitiveArray || isLiteralArray) {
      // Use first literal option if available, otherwise empty string
      const defaultValue = field.literalOptions?.[0] ?? ''
      newArray.push(defaultValue)
    } else {
      // For object arrays, create a default item from children
      newArray.push(createDefaultItem(field.children!))
    }

    form.updateField(basePath, newArray)
    // Expand the section when adding an item
    setIsCollapsed(false)
  }

  const removeItem = (index: number) => {
    const newArray = (sectionValue as any[]).filter((_: any, i: number) => i !== index)
    form.updateField(basePath, newArray)
    // Collapse the section when all items are removed
    if (newArray.length === 0) {
      setIsCollapsed(true)
    }
  }

  const renderChildren = (
    children: Record<string, any>,
    parentValue: any,
    parentPath: string,
    itemIndex?: number
  ) => {
    return Object.entries(children)
      .filter(([, childField]) => childField && childField.key) // Filter out undefined fields
      .sort(([, a], [, b]) => {
        const orderA = a.order ?? Infinity
        const orderB = b.order ?? Infinity
        if (orderA !== orderB) return orderA - orderB
        return a.key.localeCompare(b.key)
      })
      .map(([key, childField]) => {
        // Check if field has a condition and evaluate it
        if (childField.condition) {
          const { field: conditionField, value: expectedValue } = childField.condition
          const conditionValue = getNestedValue(form.data, conditionField)
          if (conditionValue !== expectedValue) {
            return null // Don't render this field
          }
        }

        const fullPath =
          itemIndex !== undefined ? `${parentPath}[${itemIndex}].${key}` : childField.key
        const fieldName = key.split('.').pop() || key
        const childValue = getNestedValue(parentValue, fieldName)

        // Translation path: always use "basePath.fieldName" (e.g., "fees.type")
        // Field metadata path: "basePath.fieldName" (e.g., "fees.type")
        // Array items share the same metadata (no index tracking needed)
        const childMetaPath = `${basePath}.${key}`
        const childMeta = getFieldMeta?.(childMetaPath)

        if (childField.type === 'object' || childField.type === 'array') {
          return (
            <FormSection
              key={fullPath}
              field={childField}
              form={form}
              basePath={fullPath}
              level={level + 1}
              initialCollapsed={itemIndex !== undefined}
              minimal={minimal}
              label={childMeta?.label}
              description={childMeta?.description}
              getFieldMeta={getFieldMeta}
              variant={variant}
            />
          )
        }

        return (
          <FormField
            key={fullPath}
            field={childField}
            value={childValue}
            onChange={(value) => form.updateField(fullPath, value)}
            error={form.validationErrors[fullPath]}
            minimal={minimal}
            label={childMeta?.label}
            description={childMeta?.description}
            getFieldMeta={getFieldMeta}
            formData={form.data}
          />
        )
      })
      .filter(Boolean) // Remove null entries from conditional rendering
  }

  const headerContent = (
    <>
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0" />
          )}
          <CardTitle className="min-w-0 flex-1 text-sm sm:text-base">
            <span className="truncate">{displayLabel || formatLabel(field.key)}</span>
            {isArray && (
              <Badge variant="outline" className="ml-2 text-xs">
                {(sectionValue as any[]).length} items
              </Badge>
            )}
          </CardTitle>
        </div>
        <div className="flex gap-2 items-center">
          {isArray && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                addItem()
              }}
              className="shrink-0"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          )}
          {!isArray && !field.required && sectionValue && Object.keys(sectionValue).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                form.updateField(basePath, undefined)
              }}
              className="shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              Clear
            </Button>
          )}
        </div>
      </div>
      {displayDescription && (
        <p className="text-muted-foreground mt-2 text-xs sm:text-sm">{displayDescription}</p>
      )}
    </>
  )

  // Render content for primitive/literal arrays
  const renderPrimitiveArrayContent = () => {
    const optionDescriptions = field.literalOptionsDescriptions || {}

    // Helper to get display label for an option
    const getOptionLabel = (option: any): string => {
      const optionKey = option?.toString() ?? ''
      return optionDescriptions[optionKey] || optionKey
    }

    if ((sectionValue as any[]).length === 0) {
      return (
        <div className="text-center text-muted-foreground py-4">
          No items yet. Click &quot;Add&quot; to create the first item.
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {(sectionValue as any[]).map((item: any, index: number) => (
          <div key={`${basePath}[${index}]`} className="flex items-center gap-2">
            {isLiteralArray ? (
              <Select
                value={item?.toString() || ''}
                onValueChange={(value) => {
                  const newArray = [...(sectionValue as any[])]
                  newArray[index] = value
                  form.updateField(basePath, newArray)
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select...">
                    {item ? getOptionLabel(item) : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {field.literalOptions?.map((option: any) => (
                    <SelectItem key={option?.toString()} value={option?.toString()}>
                      {getOptionLabel(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={item?.toString() || ''}
                onChange={(e) => {
                  const newArray = [...(sectionValue as any[])]
                  newArray[index] = e.target.value
                  form.updateField(basePath, newArray)
                }}
                className="flex-1"
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    )
  }

  const content = isArray ? (
    isPrimitiveArray || isLiteralArray ? (
      renderPrimitiveArrayContent()
    ) : (sectionValue as any[]).length === 0 ? (
      <div className="text-center text-muted-foreground py-4">
        No items yet. Click &quot;Add&quot; to create the first item.
      </div>
    ) : (
      <div className="space-y-4">
        {(sectionValue as any[]).map((item: any, index: number) => (
          <Card key={`${basePath}[${index}]`} className="border border-dashed shadow-none!">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Item {index + 1}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {renderChildren(field.children!, item, basePath, index)}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  ) : (
    <div className="grid gap-3 sm:gap-4">
      {renderChildren(field.children!, sectionValue, basePath)}
    </div>
  )

  // Flat mode: no Card wrapper, just content with header
  if (flat) {
    return (
      <div className={cn(contentSpacing)}>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold sm:text-base">
            {displayLabel || formatLabel(field.key)}
            {isArray && (
              <Badge variant="outline" className="ml-2 text-xs">
                {(sectionValue as any[]).length} items
              </Badge>
            )}
          </h3>
          {displayDescription && (
            <p className="text-muted-foreground text-xs sm:text-sm">{displayDescription}</p>
          )}
        </div>
        {isArray && (
          <Button variant="outline" size="sm" onClick={addItem} className="shrink-0">
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        )}
        {content}
      </div>
    )
  }

  return (
    <Card className={cn('border-l-4', 'border-l-primary')}>
      <CardHeader
        className={cn('cursor-pointer pb-0 gap-0', variant === 'compact' && 'p-2 sm:p-3')}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {headerContent}
      </CardHeader>

      {!isCollapsed && (
        <CardContent className={cn(contentSpacing, cardPadding, 'pt-0')}>{content}</CardContent>
      )}
    </Card>
  )
}

/**
 * Props for FormHistoryToolbar
 */
export interface FormHistoryToolbarProps<T = any> {
  /**
   * The form instance from useSchemaForm
   */
  form: UseSchemaFormReturn<T>
  /**
   * Optional className for the container
   */
  className?: string
}

/**
 * Standalone history toolbar component for undo/redo functionality.
 * Use this when you're using FormField/FormSection directly instead of FormBuilder.
 *
 * @example
 * ```tsx
 * const form = useSchemaForm({ schema: MySchema })
 *
 * return (
 *   <div>
 *     <FormHistoryToolbar form={form} />
 *     <FormField field={form.fields.name} ... />
 *   </div>
 * )
 * ```
 */
export function FormHistoryToolbar<T = any>({ form, className }: FormHistoryToolbarProps<T>) {
  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault()
          form.redo()
        } else {
          e.preventDefault()
          form.undo()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [form.undo, form.redo])

  // Don't render if there are no changes and nothing to undo/redo
  if (form.changeCount === 0 && !form.canUndo && !form.canRedo) {
    return null
  }

  return (
    <div className={cn('flex shrink-0 items-center gap-1.5', className)}>
      <Badge variant="secondary" className="text-xs tabular-nums">
        {form.changeCount} {form.changeCount === 1 ? 'change' : 'changes'}
      </Badge>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={() => form.undo()}
        disabled={!form.canUndo}
        aria-label="Undo"
      >
        <Undo2 className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={() => form.redo()}
        disabled={!form.canRedo}
        aria-label="Redo"
      >
        <Redo2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

/**
 * Form builder mode for AI or Edit
 */
export type FormBuilderMode = 'ai' | 'edit'

/**
 * Extended form builder props with variant support
 */
export interface ExtendedFormBuilderProps<T = any> extends FormBuilderProps<T> {
  /**
   * Display variant for the form
   * - default: Standard spacing and all features visible
   * - compact: Reduced spacing, sections collapsed by default, smaller text
   * - wizard: Step-by-step mode showing one section at a time
   */
  variant?: FormBuilderVariant
  /**
   * Whether all sections should be collapsed by default
   * Overrides variant defaults when specified
   */
  sectionsCollapsed?: boolean
  /**
   * Field keys to pin at the top level (shown above wizard steps or at the top of the form)
   * Useful for fields like "isActive" that should be visible on all steps
   */
  pinnedFields?: string[]
  /**
   * Field keys to hide from the form entirely
   * Useful for fields that are set programmatically and shouldn't be user-editable
   */
  hiddenFields?: string[]
  /**
   * Enable AI mode toggle. When true, shows AI/Edit mode switcher.
   * Requires form.ai to be configured in useSchemaForm.
   */
  enableAIMode?: boolean
  /**
   * Initial mode when AI is enabled
   * @default 'ai'
   */
  initialMode?: FormBuilderMode
  /**
   * Placeholder for AI chat input
   */
  aiPlaceholder?: string
  /**
   * Minimum height for the chat view in AI mode
   * @default '300px'
   */
  aiChatMinHeight?: string
  /**
   * Maximum height for the chat view in AI mode
   * When reached, the chat will scroll
   * @example '400px', '50vh'
   */
  aiChatMaxHeight?: string
  /**
   * Enable voice input in AI chat (requires OPENAI_API_KEY on server)
   * Developer must explicitly enable this when the API key is configured
   * @default false
   */
  enableVoice?: boolean
  /**
   * Custom endpoint for speech-to-text API
   * @default '/api/speech-to-text'
   */
  voiceEndpoint?: string
}

/**
 * Main form builder component
 */
export function FormBuilder<T = any>({
  form,
  className,
  title,
  collapsible = false,
  initialCollapsed = false,
  variant = 'default',
  sectionsCollapsed,
  pinnedFields = [],
  hiddenFields = [],
  enableAIMode = false,
  initialMode = 'ai',
  aiPlaceholder,
  aiChatMinHeight = '300px',
  aiChatMaxHeight,
  enableVoice = false,
  voiceEndpoint,
}: ExtendedFormBuilderProps<T>) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed)
  const [currentStep, setCurrentStep] = useState(0)
  const defaultMode = enableAIMode && form.ai ? initialMode : 'edit'
  const [mode, setMode] = useState<FormBuilderMode>(defaultMode)

  // Determine if AI mode is actually available
  const hasAI = enableAIMode && form.ai

  // History toolbar element (used in multiple places)
  const historyToolbar = <FormHistoryToolbar form={form} />

  // Determine if sections should be collapsed based on variant or explicit prop
  const defaultSectionsCollapsed = sectionsCollapsed ?? variant === 'compact'

  // Spacing classes based on variant
  const spacingClass =
    variant === 'compact' || variant === 'wizard'
      ? 'space-y-2 sm:space-y-3'
      : 'space-y-4 sm:space-y-6'

  // Set of hidden field keys
  const hiddenFieldsSet = new Set(hiddenFields)

  const calculateFieldComplexity = (field: FormFieldDefinition) => {
    if (field.type === 'object' || field.type === 'array') {
      return 1
    }
    return 0
  }

  const allRootFields = Object.entries(form.fields)
    .filter(
      ([key, field]) => field && field.key && !field.key.includes('.') && !hiddenFieldsSet.has(key)
    )
    .sort(([, a], [, b]) => {
      const orderA = a.order ?? Infinity
      const orderB = b.order ?? Infinity
      if (orderA !== orderB) return orderA - orderB
      return calculateFieldComplexity(a) - calculateFieldComplexity(b)
    })

  // Separate pinned fields from step fields
  const pinnedFieldsSet = new Set(pinnedFields)
  const pinnedFieldEntries = allRootFields.filter(([key]) => pinnedFieldsSet.has(key))
  const rootFields = allRootFields.filter(([key]) => !pinnedFieldsSet.has(key))

  // Get root-level validation errors (from Schema.filter or general validation)
  const rootError = form.validationErrors['_root']

  // Render a single field (used by both regular and wizard mode)
  const renderField = (key: string, field: FormFieldDefinition, useFlat = false) => {
    // Check if field has a condition and evaluate it
    if (field.condition) {
      const { field: conditionField, value: expectedValue } = field.condition
      const conditionValue = getNestedValue(form.data, conditionField)
      if (conditionValue !== expectedValue) {
        return null // Don't render this field
      }
    }

    // Check if this is a discriminated union (has children with conditions)
    const hasConditionalChildren =
      field.children && Object.values(field.children).some((child) => child.condition)
    if (hasConditionalChildren) {
      return (
        <DiscriminatedUnionSection
          key={field.key}
          field={field}
          form={form}
          minimal={false}
          basePath={key}
        />
      )
    }

    if (field.type === 'object' || field.type === 'array') {
      return (
        <FormSection
          key={field.key}
          field={field}
          form={form}
          basePath={key}
          level={0}
          initialCollapsed={variant === 'wizard' ? false : defaultSectionsCollapsed}
          variant={variant === 'wizard' ? 'compact' : variant}
          flat={useFlat}
        />
      )
    }

    const value = getNestedValue(form.data, key)
    return (
      <FormField
        key={field.key}
        field={field}
        value={value}
        onChange={(value) => form.updateField(key, value)}
        error={form.validationErrors[key]}
        formData={form.data}
      />
    )
  }

  // Wizard mode: step-by-step navigation
  if (variant === 'wizard') {
    const totalSteps = rootFields.length
    const [stepKey, stepField] = rootFields[currentStep] || []

    if (!stepField && rootFields.length === 0) return null

    // Pinned fields - shown in both AI and Edit modes
    const wizardPinnedFields =
      pinnedFieldEntries.length > 0 ? (
        <div className={cn(spacingClass, mode === 'edit' && 'pb-4 mb-2 border-b')}>
          {pinnedFieldEntries.map(([key, field]) => {
            const value = getNestedValue(form.data, key)
            return (
              <FormField
                key={key}
                field={field}
                value={value}
                onChange={(v) => form.updateField(key, v)}
                error={form.validationErrors[key]}
                formData={form.data}
              />
            )
          })}
        </div>
      ) : null

    // Wizard edit content (steps)
    const wizardEditContent = (
      <>
        {/* Step indicator */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <div className="flex gap-1">
            {rootFields.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={cn(
                  'h-2 w-2 rounded-full transition-colors',
                  idx === currentStep ? 'bg-primary' : 'bg-muted hover:bg-muted-foreground/50'
                )}
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Root error */}
        {rootError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{rootError}</AlertDescription>
          </Alert>
        )}

        {/* Current step content - use flat mode (no accordion) */}
        {stepField && <div className={spacingClass}>{renderField(stepKey, stepField, true)}</div>}

        {/* Navigation */}
        <div className="flex justify-between gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant={currentStep === totalSteps - 1 ? 'default' : 'outline'}
            onClick={() => setCurrentStep((s) => Math.min(totalSteps - 1, s + 1))}
            disabled={currentStep === totalSteps - 1}
          >
            Next
          </Button>
        </div>
      </>
    )

    // Wizard AI content
    const wizardAiContent = hasAI ? (
      <ChatView
        messages={form.ai!.messages}
        status={form.ai!.status}
        onSend={form.ai!.fill}
        placeholder={aiPlaceholder}
        className={cn('border rounded-lg', `min-h-[${aiChatMinHeight}]`)}
        enableVoice={enableVoice}
        voiceEndpoint={voiceEndpoint}
        maxHeight={aiChatMaxHeight}
      />
    ) : null

    // Wizard mode toggle
    const wizardModeToggle = hasAI ? (
      <div className="flex items-center gap-2">
        <Tabs
          responsive
          value={mode}
          onValueChange={(value) => setMode(value as FormBuilderMode)}
          className="flex-1"
        >
          <TabsList>
            <TabsTrigger value="ai">
              <Sparkles className="h-3.5 w-3.5" />
              AI
            </TabsTrigger>
            <TabsTrigger value="edit">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {historyToolbar}
      </div>
    ) : historyToolbar ? (
      <div className="flex justify-end">{historyToolbar}</div>
    ) : null

    return (
      <div className={cn('space-y-4', className)}>
        {wizardModeToggle}
        {wizardPinnedFields}
        {mode === 'ai' && hasAI ? wizardAiContent : wizardEditContent}
      </div>
    )
  }

  // Pinned fields - shown in both AI and Edit modes
  const regularPinnedFields =
    pinnedFieldEntries.length > 0 ? (
      <div className={cn(spacingClass, mode === 'edit' && 'pb-4 mb-2 border-b')}>
        {pinnedFieldEntries.map(([key, field]) => {
          const value = getNestedValue(form.data, key)
          return (
            <FormField
              key={key}
              field={field}
              value={value}
              onChange={(v) => form.updateField(key, v)}
              error={form.validationErrors[key]}
              formData={form.data}
            />
          )
        })}
      </div>
    ) : null

  // Regular content (default/compact modes)
  const editContent = (
    <div className={spacingClass}>
      {rootError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{rootError}</AlertDescription>
        </Alert>
      )}
      {rootFields.map(([key, field]) => renderField(key, field)).filter(Boolean)}
    </div>
  )

  // AI mode content
  const aiContent = hasAI ? (
    <ChatView
      messages={form.ai!.messages}
      status={form.ai!.status}
      onSend={form.ai!.fill}
      placeholder={aiPlaceholder}
      className={cn('border rounded-lg', `min-h-[${aiChatMinHeight}]`)}
      enableVoice={enableVoice}
      voiceEndpoint={voiceEndpoint}
      maxHeight={aiChatMaxHeight}
    />
  ) : null

  // Mode toggle buttons
  const modeToggle = hasAI ? (
    <div className="flex items-center gap-2">
      <Tabs
        responsive
        value={mode}
        onValueChange={(value) => setMode(value as FormBuilderMode)}
        className="flex-1"
      >
        <TabsList>
          <TabsTrigger value="ai">
            <Sparkles className="h-3.5 w-3.5" />
            AI
          </TabsTrigger>
          <TabsTrigger value="edit">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {historyToolbar}
    </div>
  ) : historyToolbar ? (
    <div className="flex justify-end">{historyToolbar}</div>
  ) : null

  // Select content based on mode
  const modeContent = mode === 'ai' && hasAI ? aiContent : editContent

  if (collapsible && title) {
    return (
      <Card className={className}>
        <CardHeader
          className="cursor-pointer p-3 sm:p-6 pb-0 gap-0"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex min-w-0 items-center">
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            )}
            <CardTitle className="min-w-0 flex-1 truncate text-base sm:text-lg">{title}</CardTitle>
          </div>
        </CardHeader>
        {!isCollapsed && (
          <CardContent className="p-3 sm:p-6 pt-0 space-y-4">
            {modeToggle}
            {regularPinnedFields}
            {modeContent}
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {title && <h3 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">{title}</h3>}
      {modeToggle}
      {regularPinnedFields}
      {modeContent}
    </div>
  )
}
