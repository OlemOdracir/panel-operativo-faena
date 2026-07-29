# Generador de lecturas

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .
$env:FAENA_ADMIN_EMAIL='admin@faena.local'
$env:FAENA_ADMIN_PASSWORD='la contraseña configurada en .env'
faena-reading-generator
```

Para ejecutar sus pruebas: `pip install -e ".[test]"` y `python -m pytest -q`.

El generador solo envía `POST /readings`. La detección y apertura de incidentes permanece en la API.
