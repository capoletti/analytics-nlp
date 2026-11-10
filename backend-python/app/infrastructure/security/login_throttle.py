"""In-process throttle for login attempts"""

import math
import threading
import time
from collections import deque
from typing import Deque, Dict


class LoginThrottle:
    """Allow at most `max_failures` failed logins per key within `window_seconds`.

    Attempts are counted when they start (`try_acquire`) so concurrent guesses can't
    all pass the check before any failure is recorded; successful logins `release`
    their slot.
    """

    def __init__(self, max_failures: int, window_seconds: int):
        self.max_failures = max_failures
        self.window_seconds = window_seconds
        self._attempts: Dict[str, Deque[float]] = {}
        self._lock = threading.Lock()
        self._last_sweep = time.monotonic()

    def _prune(self, attempts: Deque[float], now: float) -> None:
        while attempts and now - attempts[0] >= self.window_seconds:
            attempts.popleft()

    def _sweep(self, now: float) -> None:
        if now - self._last_sweep < self.window_seconds:
            return
        for key in list(self._attempts):
            self._prune(self._attempts[key], now)
            if not self._attempts[key]:
                del self._attempts[key]
        self._last_sweep = now

    def try_acquire(self, key: str) -> int:
        """Reserve an attempt and return 0, or return seconds until one is allowed"""
        now = time.monotonic()
        with self._lock:
            self._sweep(now)
            attempts = self._attempts.setdefault(key, deque())
            self._prune(attempts, now)
            if len(attempts) >= self.max_failures:
                return max(1, math.ceil(self.window_seconds - (now - attempts[0])))
            attempts.append(now)
            return 0

    def release(self, key: str) -> None:
        """Drop the most recent reserved attempt (the login succeeded)"""
        with self._lock:
            attempts = self._attempts.get(key)
            if attempts:
                attempts.pop()
                if not attempts:
                    del self._attempts[key]
