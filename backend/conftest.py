import pytest
from django.core.cache import cache


@pytest.fixture(autouse=True)
def _clear_throttle_cache():
    # DRF throttle counters live in the cache.
    cache.clear()
    yield
    cache.clear()
