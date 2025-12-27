"""Initialize PostgreSQL schema for the analytics backend.
Creates tables defined in SQLAlchemy models.
"""

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

from app.config import get_settings
from app.infrastructure.persistence.postgres.models import Base


async def init_db() -> None:
    settings = get_settings()
    url = (
        f"postgresql+asyncpg://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}"
        f"@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
    )

    engine = create_async_engine(url, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT to_regclass('public.dashboards')"))
        print("dashboards table:", res.scalar())

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(init_db())
