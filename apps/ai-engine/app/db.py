from __future__ import annotations
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

_db_url = os.getenv("DATABASE_URL", "file:./data/app.db")

if _db_url.startswith("file:"):
    # SQLite (ローカル開発用)
    _path = _db_url[len("file:"):]
    if not _path.startswith("/"):
        _base = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
        _path = os.path.join(_base, _path.lstrip("./"))
    _db_url = f"sqlite+aiosqlite:///{_path}"
elif _db_url.startswith("postgres://") or _db_url.startswith("postgresql://"):
    # PostgreSQL (本番用: Neon等)
    if _db_url.startswith("postgres://"):
        _db_url = "postgresql+asyncpg://" + _db_url[len("postgres://"):]
    else:
        _db_url = "postgresql+asyncpg://" + _db_url[len("postgresql://"):]

engine = create_async_engine(_db_url, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
