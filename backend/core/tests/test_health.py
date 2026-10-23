def test_health_reports_db(client, db):
    r = client.get("/api/health/")
    assert r.status_code == 200 and r.json() == {"status": "ok", "db": True}
