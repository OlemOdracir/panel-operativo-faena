# ADR 0003: Apertura transaccional de incidentes

- Estado: aceptado
- Fecha: 2026-07-29

## Contexto

Una lectura fuera de rango debe conservarse aunque ya exista un incidente activo, pero nunca debe crear incidentes duplicados bajo ingestas concurrentes.

## Decisión

La inserción de la lectura y la apertura idempotente del incidente ocurren dentro de una única transacción. PostgreSQL aplica un índice único parcial para estados activos y la inserción usa `ON CONFLICT DO NOTHING`.

## Consecuencias

Un fallo revierte ambas operaciones. La recuperación de un incidente es manual; una lectura posterior dentro de rango no lo resuelve automáticamente.
