export type PlacePreset = {
  id: string;
  label: string;
  query: string;
  hint: string;
};

export type CountryPreset = {
  id: string;
  label: string;
  places: PlacePreset[];
};

export const locationPresetCountries: CountryPreset[] = [
  {
    id: "br",
    label: "Brazil",
    places: [
      { id: "patos-pb", label: "Patos, PB", query: "Patos, Paraiba, Brazil", hint: "Interior PB" },
      { id: "joao-pessoa-pb", label: "Joao Pessoa, PB", query: "Joao Pessoa, Paraiba, Brazil", hint: "Capital PB" },
      { id: "natal-rn", label: "Natal, RN", query: "Natal, Rio Grande do Norte, Brazil", hint: "Capital RN" },
      { id: "recife-pe", label: "Recife, PE", query: "Recife, Pernambuco, Brazil", hint: "Metro PE" },
      { id: "fortaleza-ce", label: "Fortaleza, CE", query: "Fortaleza, Ceara, Brazil", hint: "Capital CE" },
      { id: "campina-grande-pb", label: "Campina Grande, PB", query: "Campina Grande, Paraiba, Brazil", hint: "Agreste PB" }
    ]
  },
  {
    id: "us",
    label: "United States",
    places: [
      { id: "miami-fl", label: "Miami, FL", query: "Miami, Florida, United States", hint: "South Florida" },
      { id: "austin-tx", label: "Austin, TX", query: "Austin, Texas, United States", hint: "Central Texas" },
      { id: "orlando-fl", label: "Orlando, FL", query: "Orlando, Florida, United States", hint: "Central Florida" },
      { id: "phoenix-az", label: "Phoenix, AZ", query: "Phoenix, Arizona, United States", hint: "Arizona" },
      { id: "denver-co", label: "Denver, CO", query: "Denver, Colorado, United States", hint: "Colorado" },
      { id: "charlotte-nc", label: "Charlotte, NC", query: "Charlotte, North Carolina, United States", hint: "North Carolina" }
    ]
  },
  {
    id: "pt",
    label: "Portugal",
    places: [
      { id: "lisbon", label: "Lisbon", query: "Lisbon, Portugal", hint: "Capital" },
      { id: "porto", label: "Porto", query: "Porto, Portugal", hint: "North" },
      { id: "braga", label: "Braga", query: "Braga, Portugal", hint: "North" },
      { id: "coimbra", label: "Coimbra", query: "Coimbra, Portugal", hint: "Center" },
      { id: "faro", label: "Faro", query: "Faro, Portugal", hint: "Algarve" }
    ]
  },
  {
    id: "mx",
    label: "Mexico",
    places: [
      { id: "mexico-city", label: "Mexico City", query: "Mexico City, Mexico", hint: "Capital" },
      { id: "guadalajara", label: "Guadalajara", query: "Guadalajara, Jalisco, Mexico", hint: "Jalisco" },
      { id: "monterrey", label: "Monterrey", query: "Monterrey, Nuevo Leon, Mexico", hint: "Nuevo Leon" },
      { id: "merida", label: "Merida", query: "Merida, Yucatan, Mexico", hint: "Yucatan" },
      { id: "queretaro", label: "Queretaro", query: "Queretaro, Mexico", hint: "Bajio" }
    ]
  },
  {
    id: "es",
    label: "Spain",
    places: [
      { id: "madrid", label: "Madrid", query: "Madrid, Spain", hint: "Capital" },
      { id: "barcelona", label: "Barcelona", query: "Barcelona, Catalonia, Spain", hint: "Catalonia" },
      { id: "valencia", label: "Valencia", query: "Valencia, Spain", hint: "Valencian Community" },
      { id: "seville", label: "Seville", query: "Seville, Andalusia, Spain", hint: "Andalusia" },
      { id: "malaga", label: "Malaga", query: "Malaga, Andalusia, Spain", hint: "Costa del Sol" }
    ]
  },
  {
    id: "ca",
    label: "Canada",
    places: [
      { id: "toronto", label: "Toronto", query: "Toronto, Ontario, Canada", hint: "Ontario" },
      { id: "vancouver", label: "Vancouver", query: "Vancouver, British Columbia, Canada", hint: "BC" },
      { id: "montreal", label: "Montreal", query: "Montreal, Quebec, Canada", hint: "Quebec" },
      { id: "calgary", label: "Calgary", query: "Calgary, Alberta, Canada", hint: "Alberta" },
      { id: "ottawa", label: "Ottawa", query: "Ottawa, Ontario, Canada", hint: "Capital" }
    ]
  }
];

export const defaultCountryId = locationPresetCountries[0].id;
export const defaultPlaceId = locationPresetCountries[0].places[0].id;

export function getCountryPreset(countryId: string) {
  return locationPresetCountries.find((country) => country.id === countryId) ?? locationPresetCountries[0];
}

export function getPlacePreset(countryId: string, placeId: string) {
  const country = getCountryPreset(countryId);
  return country.places.find((place) => place.id === placeId) ?? country.places[0];
}
