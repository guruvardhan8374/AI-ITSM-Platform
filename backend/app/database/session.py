import os
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Absolute path for SQLite fallback so seed script and uvicorn share the exact same database
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
SQLITE_DB_PATH = BASE_DIR / "itsm.db"
SQLITE_URL = f"sqlite+aiosqlite:///{SQLITE_DB_PATH.as_posix()}"

use_sqlite_env = os.getenv("USE_SQLITE", "true").lower() == "true"

if os.getenv("DATABASE_URL"):
    db_url = os.getenv("DATABASE_URL")
elif not use_sqlite_env:
    db_url = settings.DATABASE_URL
else:
    db_url = SQLITE_URL

def get_engine(url: str):
    if "sqlite" in url:
        return create_async_engine(
            url,
            echo=False,
            future=True,
            connect_args={"check_same_thread": False}
        )
    return create_async_engine(
        url,
        echo=settings.DEBUG,
        future=True,
        pool_pre_ping=True
    )

engine = get_engine(db_url)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
