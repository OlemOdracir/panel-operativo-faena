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

El generador obtiene los rangos desde `GET /sensors`: publica valores normales en el punto medio de
cada rango y outliers por encima del máximo. Solo envía `POST /readings`; la detección y apertura de
incidentes permanece en la API.
