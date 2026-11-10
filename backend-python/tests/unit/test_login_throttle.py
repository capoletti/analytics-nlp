"""Unit tests for LoginThrottle"""

import threading

from app.infrastructure.security import login_throttle
from app.infrastructure.security.login_throttle import LoginThrottle


def test_blocks_after_max_failures_and_rounds_retry_up(monkeypatch):
    now = [1000.0]
    monkeypatch.setattr(login_throttle.time, "monotonic", lambda: now[0])
    throttle = LoginThrottle(max_failures=2, window_seconds=10)

    assert throttle.try_acquire("k") == 0
    assert throttle.try_acquire("k") == 0
    now[0] += 0.5
    assert throttle.try_acquire("k") == 10  # 9.5s remaining, rounded up

    now[0] += 9.5
    assert throttle.try_acquire("k") == 0


def test_release_frees_slot_after_success():
    throttle = LoginThrottle(max_failures=1, window_seconds=60)
    assert throttle.try_acquire("k") == 0
    throttle.release("k")
    assert throttle.try_acquire("k") == 0


def test_concurrent_attempts_are_bounded():
    throttle = LoginThrottle(max_failures=3, window_seconds=60)
    results = []
    barrier = threading.Barrier(20)

    def attempt():
        barrier.wait()
        results.append(throttle.try_acquire("k"))

    threads = [threading.Thread(target=attempt) for _ in range(20)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert results.count(0) == 3


def test_expired_keys_are_swept(monkeypatch):
    now = [1000.0]
    monkeypatch.setattr(login_throttle.time, "monotonic", lambda: now[0])
    throttle = LoginThrottle(max_failures=5, window_seconds=10)

    for i in range(100):
        throttle.try_acquire(f"ip-{i}")
    now[0] += 11
    throttle.try_acquire("new")

    assert list(throttle._attempts) == ["new"]
