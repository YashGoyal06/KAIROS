import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Use SQLite async fallback for local testing if no Postgres DB URL is defined
    DATABASE_URL = "sqlite+aiosqlite:///./kairos.db"
elif DATABASE_URL.startswith("postgresql://"):
    # Convert postgresql protocol to asyncpg
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    # Disable statement caching for pgBouncer / transaction poolers compatibility
    connect_args={"statement_cache_size": 0} if "sqlite" not in DATABASE_URL else {},
    # Sqlite does not support pool_size, check if postgres
    **({"pool_size": 20, "max_overflow": 10} if "sqlite" not in DATABASE_URL else {})
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def init_db():
    from backend.app.db.models import Base
    async with engine.begin() as conn:
        # Create tables
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
