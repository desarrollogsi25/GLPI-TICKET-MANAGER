# Procedimiento de emergencia para push directo a main

## Cuándo aplica
- Hotfix crítico en producción que no puede esperar a un PR
- Bug de seguridad que requiere parche inmediato
- Rollback de emergencia

## Cuándo NO aplica
- Cambios cosméticos
- Features nuevas
- Refactors
- Documentación

## Procedimiento

1. Documentar el motivo en este archivo (sección "Historial de break-glass").
2. Desactivar temporalmente la protección de main:
   - GitHub > Settings > Branches > main > Edit
   - Desmarcar "Do not allow bypassing the above settings"
3. Hacer el push directo:
   `git push origin main`
4. Reactivar la protección inmediatamente.
5. Crear incidente en `docs/11-incidents/`:
   - Fecha, motivo, qué se pusheó, qué se rompió, cómo se verificó
   - Si fue por un bug, crear ADR si la decisión es relevante
6. Registrar la entrada en "Historial de break-glass" abajo.

## Historial de break-glass

| Fecha | Motivo | SHA | Duración ventana | Restaurado |
|---|---|---|---|---|
| (vacío) | | | | |

## Métricas
- Máximo recomendado: 1 por trimestre.
- Si se supera, revisar el proceso de PR o aumentar el equipo.
