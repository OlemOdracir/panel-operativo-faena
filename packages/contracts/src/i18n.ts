/**
 * Catálogo único de textos visibles y mensajes de dominio en español de Chile.
 * Los enums persistidos permanecen en inglés y solo se traducen en presentación.
 */
export const esCL = {
  locale: 'es-CL',
  app: {
    name: 'Panel Operativo de Faena',
    subtitle: 'Monitoreo y gestión en terreno',
    operationalPanel: 'Panel operativo',
  },
  auth: {
    loadingTitle: 'Cargando sesión',
    loadingText: 'Verificando tu acceso al panel.',
    loginTitle: 'Ingresa a la faena',
    loginDescription: 'Monitoreo de sensores y gestión del trabajo en terreno.',
    email: 'Correo',
    password: 'Contraseña',
    login: 'Ingresar',
    loggingIn: 'Ingresando…',
    logout: 'Salir',
    loginFailed: 'No fue posible iniciar sesión.',
  },
  navigation: {
    label: 'Navegación principal',
    operation: 'Operación',
    dashboard: 'Resumen',
    incidents: 'Incidentes',
    workOrders: 'Órdenes de trabajo',
  },
  footer: {
    internalUse: 'Uso interno · Operación de faena',
    protectedSession: 'Sesión protegida',
    copyright: (year: number) => `© ${year} Panel Operativo de Faena`,
  },
  dashboard: {
    eyebrow: 'Vista operacional',
    title: 'Estado de la faena',
    live: 'Datos actualizados automáticamente',
    openIncidents: 'Incidentes abiertos',
    activeWorkOrders: 'Órdenes activas',
    activeSensors: 'Sensores activos',
    averageClosureTime: 'Tiempo medio de cierre',
    inProgressHint: (count: number) => `${count} en progreso`,
    latestIncidents: 'Últimos incidentes',
    recentWorkOrders: 'Órdenes recientes',
    seeAll: 'Ver todos',
    seeAllFeminine: 'Ver todas',
    updatedAt: 'Actualizado',
    refresh: 'Actualizar',
    refreshing: 'Actualizando…',
    priorityIncidents: 'Prioridades operativas',
    priorityDescription: 'Los incidentes abiertos que requieren una decisión de supervisión.',
    severityDistribution: 'Distribución por severidad',
    workOrderSummary: 'Órdenes por estado',
    lessThanOneHour: 'Menos de 1 h',
    hoursOpen: (hours: number) => `${hours} h`,
    loadingTitle: 'Cargando resumen',
    loadingText: 'Consultando el estado operacional.',
    errorTitle: 'No se pudo cargar el resumen',
    errorText: 'Revisa la conexión y vuelve a intentar.',
  },
  incidents: {
    eyebrow: 'Monitoreo',
    title: 'Incidentes',
    description: 'Lecturas fuera de rango que requieren seguimiento operativo.',
    detailEyebrow: 'Detalle operacional',
    detailDescription: 'Incidente generado por una lectura fuera de rango.',
    detailTitle: 'Datos del incidente',
    area: 'Área',
    sensor: 'Sensor',
    status: 'Estado',
    severity: 'Severidad',
    detected: 'Detectado',
    reading: 'Lectura',
    outOfRangeReading: 'Lectura fuera de rango',
    range: 'rango',
    take: 'Tomar',
    takeIncident: 'Tomar incidente',
    resolve: 'Resolver',
    resolveIncident: 'Resolver incidente',
    back: '← Volver a incidentes',
    loadingTitle: 'Cargando incidente',
    loadingText: 'Consultando el detalle operacional.',
    errorTitle: 'No se pudo cargar el incidente',
    empty: 'No hay incidentes para mostrar.',
    filters: 'Filtrar incidentes',
    search: 'Buscar incidente',
    searchPlaceholder: 'Código, sensor o área',
    allStatuses: 'Todos los estados',
    allSeverities: 'Todas las severidades',
    allAreas: 'Todas las áreas',
    allSensors: 'Todos los sensores',
    clearFilters: 'Limpiar filtros',
    showing: (visible: number, total: number) => `Mostrando ${visible} de ${total} incidentes`,
    noMatching: 'No hay incidentes que coincidan con los filtros.',
  },
  workOrders: {
    eyebrow: 'Gestión operacional',
    title: 'Órdenes de trabajo',
    description: 'Coordina el trabajo de los equipos en terreno.',
    new: 'Nueva orden',
    cancel: 'Cancelar',
    createTitle: 'Crear orden de trabajo',
    management: 'Gestión',
    created: 'Orden creada correctamente.',
    teamsLoadFailed: 'No se pudieron cargar los equipos.',
    empty: 'Todavía no hay órdenes de trabajo.',
    titleLabel: 'Título',
    priority: 'Prioridad',
    descriptionLabel: 'Descripción',
    create: 'Crear orden',
    creating: 'Creando…',
    noTeam: 'Sin equipo',
    assign: 'Asignar',
    assignAria: (title: string) => `Asignar ${title}`,
    start: 'Iniciar',
    close: 'Cerrar',
    view: 'Ver',
    noDescription: 'Sin descripción.',
  },
  confirm: {
    cancel: 'Cancelar',
    detail: 'Detalle',
    actions: 'Acciones',
    incidentTake: {
      title: '¿Tomar el incidente?',
      description: 'Quedará reconocido a tu nombre y saldrá de la lista de incidentes sin atender.',
      action: 'Tomar incidente',
    },
    incidentResolve: {
      title: '¿Resolver el incidente?',
      description: 'Se cierra el seguimiento operativo del incidente y no se puede revertir.',
      action: 'Resolver incidente',
    },
    orderStart: {
      title: '¿Iniciar la orden?',
      description: 'La orden pasa a «En progreso» y queda visible como trabajo activo en faena.',
      action: 'Iniciar orden',
    },
    orderClose: {
      title: '¿Cerrar la orden?',
      description: 'Una orden cerrada no admite cambios posteriores y no se puede revertir.',
      action: 'Cerrar orden',
    },
    orderAssign: {
      title: '¿Asignar la orden?',
      description: (team: string) => `La orden queda asignada a ${team} y pasa a «Asignada».`,
      action: 'Asignar orden',
    },
  },
  reading: {
    rangeLabel: 'Rango',
    over: 'sobre el máximo',
    under: 'bajo el mínimo',
    withinRange: 'en rango',
  },
  state: {
    loading: 'Cargando datos…',
    noResults: 'Sin resultados',
    dataLoadFailed: 'No se pudieron cargar los datos',
  },
  status: {
    OPEN: 'Abierto',
    ACKNOWLEDGED: 'Reconocido',
    RESOLVED: 'Resuelto',
    ASSIGNED: 'Asignada',
    IN_PROGRESS: 'En progreso',
    CLOSED: 'Cerrada',
  },
  workOrderColumn: {
    OPEN: 'Abiertas',
    ASSIGNED: 'Asignadas',
    IN_PROGRESS: 'En progreso',
    CLOSED: 'Cerradas',
  },
  severity: { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Crítica' },
  role: { SUPERVISOR: 'Supervisor', ADMIN: 'Administrador' },
  api: {
    requestFailed: 'No se pudo completar la solicitud.',
    unexpectedServerError: 'Error inesperado del servidor.',
    invalidInput: 'La solicitud contiene datos no válidos.',
    authenticationRequired: 'Debes iniciar sesión para acceder.',
    insufficientPermissions: 'No tienes permisos para esta acción.',
    originNotAllowed: 'El origen de la solicitud no está permitido.',
    invalidCsrfToken: 'El token de seguridad no es válido.',
    invalidCredentials: 'Las credenciales no son válidas.',
    incidentNotFound: 'No se encontró el incidente.',
    workOrderNotFound: 'No se encontró la orden de trabajo.',
    teamNotFound: 'No se encontró el equipo.',
    sensorNotFound: 'No se encontró el sensor.',
    onlyOpenOrdersCanBeAssigned: 'Solo se pueden asignar órdenes abiertas.',
    readingCouldNotBeStored: 'No fue posible guardar la lectura.',
    incidentTransition: (from: string, to: string) =>
      `No se puede cambiar el incidente de ${labelStatus(from)} a ${labelStatus(to)}.`,
    workOrderTransition: (from: string, to: string) =>
      `No se puede cambiar la orden de ${labelStatus(from)} a ${labelStatus(to)}.`,
  },
} as const;

type StatusKey = keyof typeof esCL.status;
type SeverityKey = keyof typeof esCL.severity;
type RoleKey = keyof typeof esCL.role;

function hasKey<T extends object>(object: T, key: string): key is Extract<keyof T, string> {
  return key in object;
}
export function labelStatus(value: string): string {
  return hasKey(esCL.status, value) ? esCL.status[value as StatusKey] : value;
}
export function labelSeverity(value: string): string {
  return hasKey(esCL.severity, value) ? esCL.severity[value as SeverityKey] : value;
}
export function labelRole(value: string): string {
  return hasKey(esCL.role, value) ? esCL.role[value as RoleKey] : value;
}
/**
 * Formatea una medida con su unidad. Un número de sensor sin unidad no es
 * información: «19» no dice nada, «19 m» sí.
 */
export function formatMeasurement(value: number, unit?: string): string {
  const formatted = new Intl.NumberFormat(esCL.locale, { maximumFractionDigits: 2 }).format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(esCL.locale, { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(value),
  );
}
