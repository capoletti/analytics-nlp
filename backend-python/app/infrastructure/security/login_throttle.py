"""In-process throttle for failed login attempts"""

import threading
import time
from collections import defaultdict, deque
from typing import Deque, Dict


class LoginThrottle:
    """Allow at most `max_failures` failed logins per key within `window_seconds`"""

    def __init__(self, max_failures: int, window_seconds: int):
        self.max_failures = max_failures
        self.window_seconds = window_seconds
        self._failures: Dict[str, Deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def _prune(self, key: str, now: float) -> Deque[float]:
        attempts = self._failures[key]
        while attempts and now - attempts[0] >= self.window_seconds:
            attempts.popleft()
        if not attempts:
            del self._failures[key]
            return deque()
        return attempts

    def retry_after(self, key: str) -> int:
        """Seconds until the key may try again, or 0 if allowed"""
        now = time.monotonic()
        with self._lock:
            attempts = self._prune(key, now)
            if len(attempts) < self.max_failures:
                return 0
            return max(1, int(self.window_seconds - (now - attempts[0])))

    def record_failure(self, key: str) -> None:
        with self._lock:
            self._failures[key].append(time.monotonic())

    def reset(self, key: str) -> None:
        with self._lock:
            self._failures.pop(key, None)
