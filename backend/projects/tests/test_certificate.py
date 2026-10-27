import hashlib

from projects.certificate import compute_fingerprint


def test_fingerprint_is_pure():
    expected = hashlib.sha256(b"Compta Express\nhttps://compta.example\nSuivi des factures").hexdigest()
    assert (
        compute_fingerprint("Compta Express", "https://compta.example", "Suivi des factures", []) == expected
    )


def test_fingerprint_includes_capture_hashes():
    base = compute_fingerprint("A", "https://a.example", "B", [])
    with_capture = compute_fingerprint("A", "https://a.example", "B", ["ab" * 32])
    expected = hashlib.sha256(("A\nhttps://a.example\nB\n" + "ab" * 32).encode()).hexdigest()
    assert with_capture == expected and with_capture != base
