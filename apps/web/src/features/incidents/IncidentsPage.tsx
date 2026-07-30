import { Stack, TextField } from '@mui/material';
import { IconSearch as SearchIcon } from '../../app/icons';
import { DatePicker as _DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { Dayjs } from 'dayjs';
import type {
  MRT_ColumnFiltersState,
  MRT_PaginationState,
  MRT_SortingState,
} from 'material-react-table';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IncidentListQuery, IncidentSeverity, IncidentStatus } from '@faena/contracts';
import { esCL, labelSeverity, labelStatus } from '@faena/contracts';
import { MaterialReactTable } from 'material-react-table';
import { api } from '../../api';
import { incidentQueryKeys } from './query-keys';
import { catalogQueryKeys } from '../catalog/query-keys';
import { PageHeading } from '../../components/PageHeading';
import { FilterCard } from '../../components/FilterCard';
import { SelectField } from '../../components/SelectField';
import { ErrorState } from '../../components/ErrorState';
import { Loading } from '../../components/Loading';
import { Empty } from '../../components/Empty';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useConfirmAction } from '../../hooks/useConfirmAction';
import { useIncidentTable } from './useIncidentTable';

export function IncidentsPage() {
  const client = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: Number(params.get('page') ?? 1) - 1,
    pageSize: Number(params.get('pageSize') ?? 20),
  });
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const [q, setQ] = useState(params.get('q') ?? '');
  const [status, setStatus] = useState<IncidentStatus | ''>(
    (params.get('status') as IncidentStatus | null) ?? '',
  );
  const [severity, setSeverity] = useState<IncidentSeverity | ''>(
    (params.get('severity') as IncidentSeverity | null) ?? '',
  );
  const [areaId, setAreaId] = useState(params.get('areaId') ?? '');
  const [sensorId, setSensorId] = useState(params.get('sensorId') ?? '');
  const [openedFrom, setOpenedFrom] = useState<Dayjs | null>(null);
  const [openedTo, setOpenedTo] = useState<Dayjs | null>(null);
  const debouncedQ = useDebouncedValue(q, 300);
  const areas = useQuery({ queryKey: catalogQueryKeys.areas, queryFn: api.areas });
  const sensors = useQuery({ queryKey: catalogQueryKeys.sensors, queryFn: api.sensors });
  const query = useMemo<Partial<IncidentListQuery>>(() => {
    const tableFilter = (id: string) => columnFilters.find((filter) => filter.id === id)?.value;
    const tableSearch = tableFilter('sensorCode') ?? tableFilter('areaName');
    const tableStatus = tableFilter('status');
    const tableSeverity = tableFilter('severity');
    return {
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      q: debouncedQ || (typeof tableSearch === 'string' ? tableSearch : undefined),
      status:
        status ||
        (tableStatus === 'OPEN' || tableStatus === 'ACKNOWLEDGED' || tableStatus === 'RESOLVED'
          ? tableStatus
          : undefined),
      severity:
        severity ||
        (tableSeverity === 'LOW' ||
        tableSeverity === 'MEDIUM' ||
        tableSeverity === 'HIGH' ||
        tableSeverity === 'CRITICAL'
          ? tableSeverity
          : undefined),
      areaId: areaId || undefined,
      sensorId: sensorId || undefined,
      openedFrom: openedFrom?.toISOString(),
      openedTo: openedTo?.toISOString(),
      sortBy: (sorting[0]?.id as IncidentListQuery['sortBy']) || 'openedAt',
      sortDirection: sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : 'desc',
    };
  }, [
    pagination,
    debouncedQ,
    status,
    severity,
    areaId,
    sensorId,
    openedFrom,
    openedTo,
    sorting,
    columnFilters,
  ]);
  useEffect(() => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(query))
      if (value !== undefined && value !== '')
        next.set(key, Array.isArray(value) ? value.join(',') : String(value));
    setParams(next, { replace: true });
  }, [query, setParams]);
  const incidents = useQuery({
    queryKey: [...incidentQueryKeys.all, query],
    queryFn: () => api.incidents(query),
  });
  const change = useMutation({
    mutationFn: ({ id, next }: { id: string; next: IncidentStatus }) =>
      api.incidentStatus(id, next),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: incidentQueryKeys.all });
    },
  });
  const confirm = useConfirmAction();
  const table = useIncidentTable(
    incidents.data?.data ?? [],
    incidents.data?.meta.total ?? 0,
    incidents.data?.meta.totalPages ?? 0,
    pagination,
    setPagination,
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    (incident) =>
      confirm.request({
        ...esCL.confirm.incidentTake,
        tone: 'warning',
        onConfirm: () => change.mutate({ id: incident.id, next: 'ACKNOWLEDGED' }),
      }),
    (incident) =>
      confirm.request({
        ...esCL.confirm.incidentResolve,
        tone: 'good',
        onConfirm: () => change.mutate({ id: incident.id, next: 'RESOLVED' }),
      }),
  );
  return (
    <Stack spacing={3}>
      <PageHeading
        eyebrow={esCL.incidents.eyebrow}
        title={esCL.incidents.title}
        text={esCL.incidents.description}
      />
      <FilterCard
        title={esCL.incidents.filters}
        onClear={() => {
          setQ('');
          setStatus('');
          setSeverity('');
          setAreaId('');
          setSensorId('');
          setOpenedFrom(null);
          setOpenedTo(null);
          setColumnFilters([]);
        }}
      >
        <TextField
          label={esCL.incidents.search}
          placeholder={esCL.incidents.searchPlaceholder}
          value={q}
          onChange={(event) => setQ(event.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
        />
        <SelectField
          label={esCL.incidents.status}
          value={status}
          onChange={(value) => setStatus(value as IncidentStatus | '')}
          options={[
            ['', esCL.incidents.allStatuses],
            ['OPEN', labelStatus('OPEN')],
            ['ACKNOWLEDGED', labelStatus('ACKNOWLEDGED')],
            ['RESOLVED', labelStatus('RESOLVED')],
          ]}
        />
        <SelectField
          label={esCL.incidents.severity}
          value={severity}
          onChange={(value) => setSeverity(value as IncidentSeverity | '')}
          options={[
            ['', esCL.incidents.allSeverities],
            ['LOW', labelSeverity('LOW')],
            ['MEDIUM', labelSeverity('MEDIUM')],
            ['HIGH', labelSeverity('HIGH')],
            ['CRITICAL', labelSeverity('CRITICAL')],
          ]}
        />
        <SelectField
          label={esCL.incidents.area}
          value={areaId}
          onChange={setAreaId}
          options={[
            ['', esCL.incidents.allAreas],
            ...(areas.data ?? []).map((area) => [area.id, area.name] as [string, string]),
          ]}
        />
        <SelectField
          label={esCL.incidents.sensor}
          value={sensorId}
          onChange={setSensorId}
          options={[
            ['', esCL.incidents.allSensors],
            ...(sensors.data ?? []).map((sensor) => [sensor.id, sensor.code] as [string, string]),
          ]}
        />
        <_DatePicker
          label="Desde"
          value={openedFrom}
          onChange={setOpenedFrom}
          slotProps={{ textField: { size: 'small' } }}
        />
        <_DatePicker
          label="Hasta"
          value={openedTo}
          onChange={setOpenedTo}
          slotProps={{ textField: { size: 'small' } }}
        />
      </FilterCard>
      {incidents.isError ? (
        <ErrorState error={incidents.error} />
      ) : incidents.isPending ? (
        <Loading />
      ) : incidents.data.data.length === 0 ? (
        <Empty
          text={
            q || status || severity || areaId || sensorId
              ? esCL.incidents.noMatching
              : esCL.incidents.empty
          }
        />
      ) : (
        <MaterialReactTable table={table} />
      )}
      {confirm.dialog}
    </Stack>
  );
}
