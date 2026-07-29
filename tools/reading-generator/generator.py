"""Genera lecturas de demostración; la API es la única responsable de abrir incidentes."""

from __future__ import annotations

import logging
import os
import time
from datetime import datetime, timezone
from typing import Any

import pandas as pd
import requests


logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format="%(asctime)s %(levelname)s %(message)s")
LOGGER = logging.getLogger("faena-reading-generator")


def required(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def build_batch(sensor_ids: list[str], count: int, outlier_ratio: float) -> pd.DataFrame:
    now = datetime.now(timezone.utc)
    rows: list[dict[str, Any]] = []
    for index in range(count):
        sensor_id = sensor_ids[index % len(sensor_ids)]
        is_outlier = (index % max(1, round(1 / max(outlier_ratio, 0.01)))) == 0 if outlier_ratio else False
        rows.append({"sensorId": sensor_id, "value": 999.0 if is_outlier else 5.0, "measuredAt": now.isoformat()})
    return pd.DataFrame(rows)


def run() -> None:
    base_url = os.getenv("FAENA_API_URL", "http://localhost:13000/api/v1").rstrip("/")
    email = required("FAENA_ADMIN_EMAIL")
    password = required("FAENA_ADMIN_PASSWORD")
    interval = float(os.getenv("GENERATOR_INTERVAL_SECONDS", "10"))
    count = int(os.getenv("GENERATOR_BATCH_SIZE", "1"))
    outlier_ratio = float(os.getenv("GENERATOR_OUTLIER_RATIO", "0.2"))
    session = requests.Session()

    csrf = session.get(f"{base_url}/auth/csrf", timeout=10)
    csrf.raise_for_status()
    token = csrf.json()["token"]
    login = session.post(f"{base_url}/auth/login", json={"email": email, "password": password}, headers={"X-CSRF-Token": token}, timeout=10)
    login.raise_for_status()
    sensors = session.get(f"{base_url}/sensors", timeout=10)
    sensors.raise_for_status()
    sensor_ids = [item["id"] for item in sensors.json()]
    if not sensor_ids:
        raise RuntimeError("The API returned no sensors")

    while True:
        batch = build_batch(sensor_ids, count, outlier_ratio)
        for payload in batch.to_dict(orient="records"):
            response = session.post(f"{base_url}/readings", json=payload, headers={"X-CSRF-Token": token}, timeout=10)
            response.raise_for_status()
            LOGGER.info("reading_sent sensor_id=%s incident_id=%s", payload["sensorId"], response.json().get("incidentId"))
        time.sleep(interval)


def main() -> None:
    try:
        run()
    except KeyboardInterrupt:
        LOGGER.info("generator_stopped")


if __name__ == "__main__":
    main()
