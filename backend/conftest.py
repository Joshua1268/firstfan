import pytest
from django.core.cache import cache


@pytest.fixture(autouse=True)
def _clear_throttle_cache():
    """Les compteurs de débit de DRF vivent dans le cache : chaque test repart de zéro."""
    cache.clear()
    yield
    cache.clear()
