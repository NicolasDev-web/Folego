type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  badge?: string;
  disabled?: boolean;
};

type SegmentedControlProps<T extends string> = {
  label: string;
  options: Array<SegmentedOption<T>>;
  value: T;
  onChange: (next: T) => void;
  size?: "sm" | "md";
};

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  size = "md",
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`segmented-control segmented-${size}`}
      role="group"
      aria-label={label}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            className={`segmented-button ${active ? "is-active" : ""}`}
            aria-pressed={active}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
          >
            <span>{option.label}</span>
            {option.badge ? <small>{option.badge}</small> : null}
          </button>
        );
      })}
    </div>
  );
}
