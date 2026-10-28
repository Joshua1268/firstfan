from config.tests.test_settings_guard import run_settings

# Self-signed certificate standing in for a provider CA.
TEST_CA = """-----BEGIN CERTIFICATE-----
MIIBKDCBzgIJAJ+Maswn3e84MAoGCCqGSM49BAMCMBsxGTAXBgNVBAMMEGZpcnN0
ZmFuLXRlc3QtY2EwIBcNMjYxMDI4MTUyNjAwWhgPMjEyNjEwMDQxNTI2MDBaMBsx
GTAXBgNVBAMMEGZpcnN0ZmFuLXRlc3QtY2EwWTATBgcqhkjOPQIBBggqhkjOPQMB
BwNCAATeWQd+/S/EmbW08jCF1BeyRCuK1kbJjRN6McgpSPPErSC0AuI/8a4EgY1y
31klR2j1j4XnNepAANXNOQ/D1EYDMAoGCCqGSM49BAMCA0kAMEYCIQCFymRAqfAQ
yK58380I4AURLvN30fxe29dZYpeRil4mywIhAP6zVLc/i0CiF/sZbFXz/Ec/iDCR
4GieioQiqFmWTq5R
-----END CERTIFICATE-----
"""

DB_PROBE = (
    "import ssl; from django.conf import settings as s; db = s.DATABASES['default']; "
    "ctx = db['OPTIONS'].get('ssl_context'); "
    "print(db['CONN_MAX_AGE'], db['CONN_HEALTH_CHECKS'], type(ctx).__name__, "
    "ctx and ctx.verify_mode == ssl.CERT_REQUIRED, ctx and ctx.check_hostname, "
    "ctx and [c['subject'] for c in ctx.get_ca_certs()])"
)


def test_database_defaults_to_no_ssl_and_short_connections():
    r = run_settings(DB_PROBE, DATABASE_SSL=None, DATABASE_SSL_ROOT_CERT=None, CONN_MAX_AGE=None)
    assert r.returncode == 0, r.stderr
    assert r.stdout.split()[:3] == ["0", "True", "NoneType"]


def test_database_ssl_uses_a_verified_context():
    r = run_settings(DB_PROBE, DATABASE_SSL="true", DATABASE_SSL_ROOT_CERT=None)
    assert r.returncode == 0, r.stderr
    assert "SSLContext True True" in r.stdout


def test_database_ssl_trusts_the_provider_ca(tmp_path):
    ca = tmp_path / "db-ca.pem"
    ca.write_text(TEST_CA)
    r = run_settings(DB_PROBE, DATABASE_SSL="true", DATABASE_SSL_ROOT_CERT=str(ca))
    assert r.returncode == 0, r.stderr
    assert "SSLContext True True" in r.stdout
    assert "firstfan-test-ca" in r.stdout


def test_missing_provider_ca_fails_at_startup(tmp_path):
    r = run_settings(DB_PROBE, DATABASE_SSL="true", DATABASE_SSL_ROOT_CERT=str(tmp_path / "absent.pem"))
    assert r.returncode != 0
    assert "absent.pem" in r.stderr or "FileNotFoundError" in r.stderr


def test_conn_max_age_is_read_from_env():
    r = run_settings(DB_PROBE, CONN_MAX_AGE="60")
    assert r.returncode == 0, r.stderr
    assert r.stdout.split()[0] == "60"
