import { FormControl, InputLabel, OutlinedInput, Select } from '@mui/material';
import { useId } from 'react';

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  const labelId = useId();
  return (
    <FormControl fullWidth>
      {/*
        Un `Select native` siempre pinta su primera opción, incluso con valor
        vacío. MUI, en cambio, solo encoge la etiqueta cuando hay valor: la
        etiqueta quedaba encima del texto de la opción («Todos los estados»
        duplicado). `shrink` + `notched` la fijan arriba y abren el hueco en el
        borde.
      */}
      <InputLabel id={labelId} shrink>
        {label}
      </InputLabel>
      <Select
        native
        labelId={labelId}
        input={<OutlinedInput notched label={label} />}
        inputProps={{ 'aria-label': label }}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map(([option, text]) => (
          <option key={option} value={option}>
            {text}
          </option>
        ))}
      </Select>
    </FormControl>
  );
}
