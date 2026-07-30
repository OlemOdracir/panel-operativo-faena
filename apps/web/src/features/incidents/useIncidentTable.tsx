import { Button, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_PaginationState,
  type MRT_SortingState,
} from 'material-react-table';
import { MRT_Localization_ES } from 'material-react-table/locales/es';
import { useMemo, type Dispatch, type SetStateAction } from 'react';
import type { IncidentResponse, IncidentSeverity, IncidentStatus } from '@faena/contracts';
import { esCL, formatDateTime } from '@faena/contracts';
import { SeverityChip } from '../../components/SeverityChip';
import { StatusChip } from '../../components/StatusChip';
import { IconDetail, IconResolve, IconTake } from '../../app/icons';

export function useIncidentTable(
  data: IncidentResponse[],
  rowCount: number,
  pageCount: number,
  pagination: MRT_PaginationState,
  setPagination: Dispatch<SetStateAction<MRT_PaginationState>>,
  sorting: MRT_SortingState,
  setSorting: Dispatch<SetStateAction<MRT_SortingState>>,
  columnFilters: MRT_ColumnFiltersState,
  setColumnFilters: Dispatch<SetStateAction<MRT_ColumnFiltersState>>,
  take: (incident: IncidentResponse) => void,
  resolve: (incident: IncidentResponse) => void,
) {
  const columns = useMemo<MRT_ColumnDef<IncidentResponse>[]>(
    () => [
      { accessorKey: 'sensorCode', header: 'Sensor' },
      { accessorKey: 'areaName', header: 'Área' },
      {
        accessorKey: 'value',
        header: 'Lectura',
        Cell: ({ cell, row }) =>
          `${cell.getValue<number>()} (${row.original.minValue}–${row.original.maxValue})`,
      },
      {
        accessorKey: 'severity',
        header: 'Severidad',
        Cell: ({ cell }) => <SeverityChip severity={cell.getValue<IncidentSeverity>()} />,
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        Cell: ({ cell }) => <StatusChip status={cell.getValue<IncidentStatus>()} />,
      },
      {
        accessorKey: 'openedAt',
        header: 'Detectado',
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
    // Las acciones cierran la fila: se leen después del dato, no antes.
    positionActionsColumn: 'last',
    displayColumnDefOptions: {
      'mrt-row-actions': { header: esCL.confirm.actions, size: 190 },
    },
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    rowCount,
    pageCount,
    state: { columnFilters, pagination, sorting },
    muiTableBodyRowProps: { className: 'list-row' },
    renderRowActions: ({ row }) => (
      <Stack direction="row" spacing={0.5}>
        <Button
          component={RouterLink}
          to={`/incidents/${row.original.id}`}
          size="small"
          startIcon={<IconDetail />}
        >
          {esCL.confirm.detail}
        </Button>
        {row.original.status === 'OPEN' && (
          <Button size="small" startIcon={<IconTake />} onClick={() => take(row.original)}>
            {esCL.incidents.take}
          </Button>
        )}
        {row.original.status === 'ACKNOWLEDGED' && (
          <Button size="small" startIcon={<IconResolve />} onClick={() => resolve(row.original)}>
            {esCL.incidents.resolve}
          </Button>
        )}
      </Stack>
    ),
  });
}
