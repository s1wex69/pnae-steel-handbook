import { Label } from "@/components/ui/label";
import { StyledSelect } from "@/components/handbooks/SelectStep";
import { clampDecimalPlaces } from "@/lib/decimalPlaces";

interface Props {
  value: number;
  onChange: (places: number) => void;
  className?: string;
}

export function DecimalPlacesControl({ value, onChange, className }: Props) {
  const places = clampDecimalPlaces(value);

  return (
    <div className={className}>
      <Label htmlFor="decimal-places">Округление результата</Label>
      <StyledSelect
        hasValue
        id="decimal-places"
        value={String(places)}
        onChange={(e) => onChange(clampDecimalPlaces(Number(e.target.value)))}
        className="mt-2 max-w-[200px]"
      >
        {Array.from({ length: 11 }, (_, i) => (
          <option key={i} value={i}>
            {i} {i === 1 ? "знак" : i >= 2 && i <= 4 ? "знака" : "знаков"} после запятой
          </option>
        ))}
      </StyledSelect>
    </div>
  );
}
