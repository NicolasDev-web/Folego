type SectionHeaderProps = {
  title: string;
  description: string;
  marker?: string;
};

export function SectionHeader({ title, description, marker }: SectionHeaderProps) {
  return (
    <header className="section-header">
      {marker ? <p className="section-marker">{marker}</p> : null}
      <h2>{title}</h2>
      <p>{description}</p>
    </header>
  );
}

