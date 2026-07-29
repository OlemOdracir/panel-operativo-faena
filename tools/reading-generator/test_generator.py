from __future__ import annotations

import pytest

from generator import build_batch, required


def test_build_batch_cycles_sensors_and_keeps_requested_shape() -> None:
    batch = build_batch(
        [
            {"id": "sensor-a", "minValue": 0, "maxValue": 10},
            {"id": "sensor-b", "minValue": 6, "maxValue": 9},
        ],
        count=5,
        outlier_ratio=0,
    )

    assert list(batch["sensorId"]) == ["sensor-a", "sensor-b", "sensor-a", "sensor-b", "sensor-a"]
    assert len(batch) == 5
    assert batch["value"].tolist() == [5.0, 7.5, 5.0, 7.5, 5.0]
    assert batch["measuredAt"].notna().all()


def test_build_batch_marks_outliers_without_domain_logic() -> None:
    batch = build_batch(
        [{"id": "sensor-a", "minValue": 0, "maxValue": 10}], count=5, outlier_ratio=0.5
    )

    assert batch["value"].tolist() == [12.0, 5.0, 12.0, 5.0, 12.0]


def test_build_batch_rejects_empty_sensor_catalog() -> None:
    with pytest.raises(ValueError, match="sensor"):
        build_batch([], count=1, outlier_ratio=0.2)


def test_required_reads_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("FAENA_TEST_VALUE", "configured")
    assert required("FAENA_TEST_VALUE") == "configured"

    monkeypatch.delenv("FAENA_TEST_VALUE")
    with pytest.raises(RuntimeError, match="FAENA_TEST_VALUE"):
        required("FAENA_TEST_VALUE")
