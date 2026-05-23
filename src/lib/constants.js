// Barrios de CABA (se mantiene para los filtros de búsqueda)
export const ZONAS_CABA = [
  'Almagro', 'Balvanera', 'Barracas', 'Belgrano', 'Boedo', 'Caballito',
  'Chacarita', 'Coghlan', 'Colegiales', 'Constitución', 'Flores', 'Floresta',
  'La Boca', 'La Paternal', 'Liniers', 'Mataderos', 'Monte Castro', 'Montserrat',
  'Nueva Pompeya', 'Núñez', 'Palermo', 'Parque Avellaneda', 'Parque Chacabuco',
  'Parque Chas', 'Parque Patricios', 'Puerto Madero', 'Recoleta', 'Retiro',
  'Saavedra', 'San Cristóbal', 'San Nicolás', 'San Telmo', 'Versalles',
  'Villa Crespo', 'Villa del Parque', 'Villa Devoto', 'Villa General Mitre',
  'Villa Lugano', 'Villa Luro', 'Villa Ortúzar', 'Villa Pueyrredón',
  'Villa Real', 'Villa Riachuelo', 'Villa Santa Rita', 'Villa Soldati',
  'Villa Urquiza', 'GBA Norte', 'GBA Sur', 'GBA Oeste', 'Virtual / Online',
]

// Ciudades principales de Buenos Aires (Provincia)
export const CIUDADES_BUENOS_AIRES = [
  'La Plata', 'Mar del Plata', 'Quilmes', 'Lomas de Zamora', 'Lanús',
  'Merlo', 'Morón', 'Tigre', 'San Isidro', 'Vicente López',
  'Avellaneda', 'Florencio Varela', 'Berazategui', 'Almirante Brown',
  'Esteban Echeverría', 'Ezeiza', 'San Martín', 'Tres de Febrero',
  'Hurlingham', 'Ituzaingó', 'Moreno', 'Malvinas Argentinas',
  'José C. Paz', 'San Miguel', 'Zárate', 'Campana', 'Luján',
  'Junín', 'Tandil', 'Bahía Blanca', 'Azul', 'Olavarría',
  'San Nicolás de los Arroyos', 'Pergamino', 'Necochea', 'Pilar',
]

// Todas las provincias argentinas
export const PROVINCIAS = [
  'Buenos Aires (Provincia)', 'CABA', 'Catamarca', 'Chaco', 'Chubut',
  'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa',
  'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta',
  'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán',
]

// Lista completa para campos combo (dropdown + texto libre)
export const ZONAS_ALL = [
  'Virtual / Online',
  // CABA
  'CABA — Almagro', 'CABA — Balvanera', 'CABA — Barracas', 'CABA — Belgrano',
  'CABA — Boedo', 'CABA — Caballito', 'CABA — Chacarita', 'CABA — Coghlan',
  'CABA — Colegiales', 'CABA — Constitución', 'CABA — Flores', 'CABA — Floresta',
  'CABA — La Boca', 'CABA — Liniers', 'CABA — Mataderos', 'CABA — Montserrat',
  'CABA — Núñez', 'CABA — Palermo', 'CABA — Parque Patricios', 'CABA — Recoleta',
  'CABA — Retiro', 'CABA — Saavedra', 'CABA — San Telmo', 'CABA — Villa Crespo',
  'CABA — Villa del Parque', 'CABA — Villa Devoto', 'CABA — Villa Urquiza',
  // GBA
  'GBA Norte', 'GBA Sur', 'GBA Oeste',
  // Ciudades Buenos Aires
  ...CIUDADES_BUENOS_AIRES,
  // Provincias
  ...PROVINCIAS,
]

export const OBRAS_SOCIALES = [
  'OSDE', 'Swiss Medical', 'Galeno', 'Medifé', 'PAMI', 'IOMA', 'OSECAC',
  'OSDEPYM', 'Unión Personal', 'OSPECOM', 'ACCORD SALUD', 'AMEBPBA',
  'Sancor Salud', 'Luis Pasteur', 'Jerárquicos Salud', 'OSPEDYC',
  'Particular (sin cobertura)',
]

export const ESPECIALIDADES = [
  'Salud Mental', 'Discapacidad', 'Adultos mayores', 'Infanto-juvenil',
  'Adicciones', 'Autismo (TEA)', 'Trastornos del neurodesarrollo',
  'Psiquiátrico', 'Neurológico', 'Oncología', 'Post-operatorio',
]
