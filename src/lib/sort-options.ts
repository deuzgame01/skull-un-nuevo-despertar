/** Opciones compartidas por los sheets de orden del catálogo público. */
export const PRODUCT_SORT_OPTIONS = [
  { value: 'featured', label: 'Destacados', hint: 'Primero las piezas destacadas' },
  { value: 'recent', label: 'Más recientes', hint: 'Últimas piezas agregadas' },
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
  { value: 'name-asc', label: 'Nombre: A–Z' },
] as const;

/** Opciones del sheet de orden en el panel de administración. */
export const ADMIN_SORT_OPTIONS = [
  { value: 'recent', label: 'Más recientes', hint: 'Últimas piezas agregadas' },
  { value: 'oldest', label: 'Más antiguos', hint: 'Piezas más antiguas primero' },
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
  { value: 'name-asc', label: 'Nombre: A–Z' },
] as const;
