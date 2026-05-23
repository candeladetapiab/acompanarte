import { forwardRef } from 'react'

// Input con sugerencias predefinidas (datalist) + texto libre.
// Usa forwardRef para ser compatible con react-hook-form {...register('campo')}.
const ComboInput = forwardRef(function ComboInput(
  { listId, options, placeholder, className = 'input-field', ...inputProps },
  ref
) {
  return (
    <>
      <input
        ref={ref}
        list={listId}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        {...inputProps}
      />
      <datalist id={listId}>
        {options.map(o => (
          <option key={o} value={o} />
        ))}
      </datalist>
    </>
  )
})

export default ComboInput
