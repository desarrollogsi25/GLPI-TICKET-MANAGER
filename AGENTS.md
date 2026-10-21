# Reglas de eficiencia para futuras sesiones

- Para explorar código, busca fragmentos con `rg` o `Select-String`; evita volcar archivos completos.
- Limita las salidas de terminal: usa `Select-Object -First 20` o `-Last 10` cuando corresponda.
- No narres cada comando; comunica los resultados por fase y el error exacto si algo falla.
- Si el contexto crece demasiado, usa `/compact` antes de continuar.
