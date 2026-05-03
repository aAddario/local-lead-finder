export type CategoryConfig = {
  id: string;
  label: string;
  tags: Record<string, string[]>;
  highTicket: boolean;
};

export const categoryConfigs: CategoryConfig[] = [
  { id: "clinics", label: "Clínicas", tags: { amenity: ["clinic", "doctors"], healthcare: ["clinic", "doctor"] }, highTicket: true },
  { id: "dentists", label: "Dentistas", tags: { amenity: ["dentist"], healthcare: ["dentist"] }, highTicket: true },
  { id: "restaurants", label: "Restaurantes", tags: { amenity: ["restaurant", "fast_food"] }, highTicket: false },
  { id: "cafes", label: "Cafés", tags: { amenity: ["cafe"] }, highTicket: false },
  { id: "salons", label: "Salões de beleza", tags: { shop: ["hairdresser", "beauty"] }, highTicket: true },
  { id: "aesthetics", label: "Estéticas", tags: { shop: ["beauty"], healthcare: ["centre", "clinic"] }, highTicket: true },
  { id: "petshops", label: "Pet shops", tags: { shop: ["pet"], amenity: ["veterinary"] }, highTicket: true },
  { id: "repair", label: "Oficinas", tags: { shop: ["car_repair"], craft: ["mechanic"] }, highTicket: false },
  { id: "furniture", label: "Lojas de móveis", tags: { shop: ["furniture"] }, highTicket: true },
  { id: "gyms", label: "Academias", tags: { leisure: ["fitness_centre"], amenity: ["gym"] }, highTicket: true },
  { id: "offices", label: "Escritórios locais", tags: { office: ["lawyer", "accountant", "company", "estate_agent"] }, highTicket: true }
];

export const categoryById = new Map(categoryConfigs.map((category) => [category.id, category]));

const readable: Record<string, string> = {
  clinic: "Clínica",
  doctors: "Clínica médica",
  doctor: "Clínica médica",
  dentist: "Dentista",
  restaurant: "Restaurante",
  fast_food: "Restaurante",
  cafe: "Café",
  hairdresser: "Salão de beleza",
  beauty: "Estética",
  pet: "Pet shop",
  veterinary: "Veterinária",
  car_repair: "Oficina",
  mechanic: "Oficina",
  furniture: "Loja de móveis",
  fitness_centre: "Academia",
  gym: "Academia",
  lawyer: "Escritório jurídico",
  accountant: "Escritório contábil",
  company: "Escritório local",
  estate_agent: "Imobiliária"
};

export function getReadableCategory(tags: Record<string, string>) {
  const keys = ["amenity", "shop", "office", "healthcare", "leisure", "craft"];
  for (const key of keys) {
    const value = tags[key];
    if (value) return readable[value] ?? value.replaceAll("_", " ");
  }
  return "Empresa local";
}

export function isHighTicketCategory(category: string) {
  const normalized = category.toLowerCase();
  return ["clinica", "dentista", "estetica", "pet", "moveis", "academia", "juridico", "contabil", "imobiliaria"].some((term) =>
    normalized.includes(term)
  );
}
