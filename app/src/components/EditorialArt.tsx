const descriptions = {
  "contas-em-casa": "Colagem de duas pessoas conferindo um recibo e um caderno à mesa de casa.",
  "compras-de-feira": "Colagem de uma sacola com tomates e feijão sobre um recibo, junto a uma balança.",
  "gestos-de-trabalho": "Colagem de mãos trabalhando numa bancada de conserto e num balcão de comércio.",
  "praca-cearense": "Colagem de uma praça imaginada no Ceará, com lojas, pedestres e uma parada de ônibus.",
};

export function EditorialArt({ name, sizes }: { name: keyof typeof descriptions; sizes: string }) {
  const base = `/artes/${name}`;
  const cover = name === "contas-em-casa";
  return (
    <img
      className="editorial-art"
      src={`${base}-600.webp`}
      srcSet={`${base}-600.webp 600w, ${base}-1200.webp 1200w`}
      sizes={sizes}
      width={1200}
      height={800}
      alt={descriptions[name]}
      loading={cover ? "eager" : "lazy"}
      fetchPriority={cover ? "high" : "auto"}
      decoding="async"
    />
  );
}
