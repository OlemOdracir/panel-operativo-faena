/**
 * Sistema de iconos.
 *
 * Se mantiene `@mui/icons-material`, que ya era una dependencia del proyecto,
 * en lugar de sumar una segunda librería: convive de forma nativa con el tema
 * (hereda `color` y `fontSize`, funciona en `Chip icon`, `Button startIcon` e
 * `IconButton`) y no agrega peso al bundle más allá de los iconos importados.
 * El problema no era la falta de una librería sino el uso disperso y con
 * variantes mezcladas —unas rellenas y otras `Outlined`—, que es justamente lo
 * que hacía ver el conjunto desprolijo.
 *
 * Reglas del sistema:
 *
 * 1. Se usa la variante `Outlined` en todo. El trazo pesa menos que el relleno
 *    y es lo que da la lectura sobria de panel administrativo.
 * 2. Ningún componente importa de `@mui/icons-material` directamente: importa
 *    desde aquí. Los nombres son semánticos (`IconResolve`), no gráficos
 *    (`CheckCircle`), así que cambiar el ícono de una acción —o migrar a otra
 *    librería— es un cambio en este archivo y en ninguno más.
 */

// Navegación y estructura
export { default as IconDashboard } from '@mui/icons-material/DashboardOutlined';
export { default as IconIncidents } from '@mui/icons-material/WarningAmberOutlined';
export { default as IconWorkOrders } from '@mui/icons-material/WorkOutlineOutlined';
export { default as IconMenu } from '@mui/icons-material/MenuOutlined';
export { default as IconCollapse } from '@mui/icons-material/ChevronLeftOutlined';
export { default as IconLogout } from '@mui/icons-material/LogoutOutlined';
export { default as IconBack } from '@mui/icons-material/ArrowBackOutlined';

// Acciones
export { default as IconRefresh } from '@mui/icons-material/RefreshOutlined';
export { default as IconAdd } from '@mui/icons-material/AddOutlined';
export { default as IconSearch } from '@mui/icons-material/SearchOutlined';
export { default as IconClear } from '@mui/icons-material/ClearOutlined';
export { default as IconDetail } from '@mui/icons-material/VisibilityOutlined';
export { default as IconTake } from '@mui/icons-material/PanToolAltOutlined';
export { default as IconResolve } from '@mui/icons-material/TaskAltOutlined';
export { default as IconStart } from '@mui/icons-material/PlayArrowOutlined';
export { default as IconClose } from '@mui/icons-material/DoneAllOutlined';
export { default as IconAssign } from '@mui/icons-material/GroupAddOutlined';

// Dirección del desvío de una lectura respecto de su rango.
export { default as IconOverMax } from '@mui/icons-material/ArrowUpwardOutlined';
export { default as IconUnderMin } from '@mui/icons-material/ArrowDownwardOutlined';

// Estado. Acompañan a la etiqueta en los chips: el color de la escala de
// severidad no alcanza el umbral de separación para daltonismo por sí solo
// (ver `docs/architecture.md`), así que forma y texto son los canales firmes.
export { default as IconStateNeutral } from '@mui/icons-material/RadioButtonUncheckedOutlined';
export { default as IconStateInfo } from '@mui/icons-material/AutorenewOutlined';
export { default as IconStateGood } from '@mui/icons-material/CheckCircleOutlined';
export { default as IconStateWarning } from '@mui/icons-material/ErrorOutlineOutlined';
export { default as IconStateSerious } from '@mui/icons-material/ReportProblemOutlined';
export { default as IconStateCritical } from '@mui/icons-material/DangerousOutlined';
