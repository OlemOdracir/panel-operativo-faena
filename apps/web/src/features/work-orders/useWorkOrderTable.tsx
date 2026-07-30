import { Button, Select, Stack } from '@mui/material';
import {
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_PaginationState,
  type MRT_SortingState,
} from 'material-react-table';
import { MRT_Localization_ES } from 'material-react-table/locales/es';
import { useMemo, type Dispatch, type SetStateAction } from 'react';
import type { Priority, WorkOrderResponse, WorkOrderStatus } from '@faena/contracts';
import { esCL, formatDateTime } from '@faena/contracts';
import type { Team } from '../../api';
import { SeverityChip } from '../../components/SeverityChip';
import { StatusChip } from '../../components/StatusChip';
import { IconClose, IconStart } from '../../app/icons';

export function useWorkOrderTable(
  data: WorkOrderResponse[],
  rowCount: number,
  pageCount: number,
  pagination: MRT_PaginationState,
  setPagination: Dispatch<SetStateAction<MRT_PaginationState>>,
  sorting: MRT_SortingState,
  setSorting: Dispatch<SetStateAction<MRT_SortingState>>,
  columnFilters: MRT_ColumnFiltersState,
  setColumnFilters: Dispatch<SetStateAction<MRT_ColumnFiltersState>>,
  teams: Team[],
  assign: (order: WorkOrderResponse, team: Team) => void,
  advance: (order: WorkOrderResponse, next: WorkOrderStatus) => void,
) {
  const columns = useMemo<MRT_ColumnDef<WorkOrderResponse>[]>(
    () => [
      { accessorKey: 'title', header: 'Orden' },
      {
        accessorKey: 'priority',
        header: 'Prioridad',
        Cell: ({ cell }) => <SeverityChip severity={cell.getValue<Priority>()} />,
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        Cell: ({ cell }) => <StatusChip status={cell.getValue<WorkOrderStatus>()} />,
      },
      {
        accessorKey: 'teamName',
        header: 'Equipo',
        Cell: ({ cell }) => cell.getValue<string | null>() ?? esCL.workOrders.noTeam,
      },
      {
        accessorKey: 'createdAt',
        header: 'Creada',
        Cell: ({ cell }) => formatDateTime(cell.getValue<string>()),
      },
    ],
    [],
  );
  return useMaterialReactTable({
    columns,
    data,
    localization: MRT_Localization_ES,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    enableColumnFilters: true,
    enableRowActions: true,
    // Las acciones cierran la fila: se leen después del dato, no antes. Además
    // van fijadas, para que sigan alcanzables si la tabla se desplaza en
    // horizontal por el ancho de las demás columnas.
    positionActionsColumn: 'last',
    enableColumnPinning: true,
    initialState: { columnPinning: { right: ['mrt-row-actions'] } },
    displayColumnDefOptions: {
      'mrt-row-actions': { header: esCL.confirm.actions, size: 200 },
    },
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    rowCount,
    pageCount,
    state: { columnFilters, pagination, sorting },
    muiTableBodyRowProps: { className: 'list-row' },
    renderRowActions: ({ row }) => (
      <Stack direction="row" spacing={0.5} alignItems="center">
        {row.original.status === 'OPEN' && (
          // Se mantiene el select nativo: el recorte venía del ancho de la
          // columna, no del control. La primera opción hace de etiqueta.
          <Select
            native
            size="small"
            defaultValue=""
            displayEmpty
            inputProps={{ 'aria-label': esCL.workOrders.assignAria(row.original.title) }}
            sx={{ minWidth: 150 }}
            onChange={(event) => {
              const team = teams.find((item) => item.id === event.target.value);
              if (team) assign(row.original, team);
            }}
          >
            <option value="">{esCL.workOrders.assign}</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </Select>
        )}
        {row.original.status === 'ASSIGNED' && (
          <Button
            size="small"
            startIcon={<IconStart />}
            onClick={() => advance(row.original, 'IN_PROGRESS')}
          >
            {esCL.workOrders.start}
          </Button>
        )}
        {row.original.status === 'IN_PROGRESS' && (
          <Button
            size="small"
            startIcon={<IconClose />}
            onClick={() => advance(row.original, 'CLOSED')}
          >
            {esCL.workOrders.close}
          </Button>
        )}
      </Stack>
    ),
  });
}
