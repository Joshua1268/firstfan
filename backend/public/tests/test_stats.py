from accounts.models import TesterProfile, User


def make_tester(username, verification):
    user = User.objects.create_user(username=username, password="x", role=User.Role.TESTER)
    return TesterProfile.objects.create(user=user, profession="QA", verification=verification)


def test_stats_counts_only_verified_testers(client, db):
    make_tester("a", TesterProfile.Verification.VERIFIED)
    make_tester("b", TesterProfile.Verification.PENDING)
    r = client.get("/api/public/stats/")
    assert r.status_code == 200
    assert r.json() == {"tests_in_progress": 0, "verified_testers": 1, "apps_tested": 0, "demo": True}
    assert "max-age=15" in r["Cache-Control"]


def test_stats_never_exposes_amounts(client, db):
    assert not any(k for k in client.get("/api/public/stats/").json() if "amount" in k or "fcfa" in k)
