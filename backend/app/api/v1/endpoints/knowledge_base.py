from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, or_
from sqlalchemy.orm import selectinload

from app.database.session import get_db
from app.api.deps import get_current_user, require_permission
from app.models.domain_models import KnowledgeArticle, User
from app.schemas.knowledge_base import (
    KnowledgeArticleCreate, KnowledgeArticleUpdate, KnowledgeArticleResponse
)

router = APIRouter()

@router.post("", response_model=KnowledgeArticleResponse, status_code=status.HTTP_201_CREATED, summary="Create Knowledge Article")
async def create_article(
    article_in: KnowledgeArticleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Auto-generate KB-xxxx
    count_stmt = select(func.count(KnowledgeArticle.id))
    res = await db.execute(count_stmt)
    total_count = res.scalar() or 0
    kb_number = f"KB-{1001 + total_count}"

    new_art = KnowledgeArticle(
        article_number=kb_number,
        title=article_in.title,
        category=article_in.category,
        problem=article_in.problem,
        symptoms=article_in.symptoms,
        root_cause=article_in.root_cause,
        resolution=article_in.resolution,
        workaround=article_in.workaround,
        content=article_in.content,
        tags=article_in.tags,
        author_id=current_user.id,
        status=article_in.status or "Published",
        views=0,
        helpful_count=0,
        not_helpful_count=0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        published_at=datetime.utcnow()
    )

    db.add(new_art)
    await db.commit()

    stmt = select(KnowledgeArticle).options(
        selectinload(KnowledgeArticle.author)
    ).where(KnowledgeArticle.id == new_art.id)
    out_res = await db.execute(stmt)
    return out_res.scalars().first()

@router.get("", response_model=List[KnowledgeArticleResponse], summary="Search & Filter Knowledge Base Articles")
async def list_articles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100)
):
    stmt = select(KnowledgeArticle).options(
        selectinload(KnowledgeArticle.author)
    )

    if category:
        stmt = stmt.where(KnowledgeArticle.category == category)
    if status_filter:
        stmt = stmt.where(KnowledgeArticle.status == status_filter)
    else:
        stmt = stmt.where(KnowledgeArticle.status == "Published")

    if search:
        search_fmt = f"%{search}%"
        stmt = stmt.where(
            or_(
                KnowledgeArticle.article_number.ilike(search_fmt),
                KnowledgeArticle.title.ilike(search_fmt),
                KnowledgeArticle.content.ilike(search_fmt),
                KnowledgeArticle.problem.ilike(search_fmt),
                KnowledgeArticle.symptoms.ilike(search_fmt),
                KnowledgeArticle.resolution.ilike(search_fmt),
                KnowledgeArticle.tags.ilike(search_fmt)
            )
        )

    stmt = stmt.order_by(KnowledgeArticle.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/{id}", response_model=KnowledgeArticleResponse, summary="Get Knowledge Article Details")
async def get_article(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(KnowledgeArticle).options(
        selectinload(KnowledgeArticle.author)
    ).where(or_(KnowledgeArticle.id == id, KnowledgeArticle.article_number == id))
    res = await db.execute(stmt)
    art = res.scalars().first()

    if not art:
        raise HTTPException(status_code=404, detail="Knowledge article not found")

    # Increment view count
    art.views += 1
    await db.commit()
    await db.refresh(art)
    return art

@router.put("/{id}", response_model=KnowledgeArticleResponse, summary="Update Knowledge Article")
async def update_article(
    id: str,
    article_in: KnowledgeArticleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(KnowledgeArticle).options(
        selectinload(KnowledgeArticle.author)
    ).where(KnowledgeArticle.id == id)
    res = await db.execute(stmt)
    art = res.scalars().first()
    if not art:
        raise HTTPException(status_code=404, detail="Knowledge article not found")

    for field, val in article_in.dict(exclude_unset=True).items():
        setattr(art, field, val)

    art.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(art)
    return art

@router.delete("/{id}", summary="Delete Knowledge Article")
async def delete_article(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users.manage"))
):
    stmt = select(KnowledgeArticle).where(KnowledgeArticle.id == id)
    res = await db.execute(stmt)
    art = res.scalars().first()
    if not art:
        raise HTTPException(status_code=404, detail="Knowledge article not found")

    await db.delete(art)
    await db.commit()
    return {"message": "Article deleted successfully"}

@router.post("/{id}/helpful", response_model=KnowledgeArticleResponse, summary="Vote Helpful for Article")
async def vote_helpful(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(KnowledgeArticle).options(
        selectinload(KnowledgeArticle.author)
    ).where(KnowledgeArticle.id == id)
    res = await db.execute(stmt)
    art = res.scalars().first()
    if not art:
        raise HTTPException(status_code=404, detail="Knowledge article not found")

    art.helpful_count += 1
    await db.commit()
    await db.refresh(art)
    return art

@router.post("/{id}/not-helpful", response_model=KnowledgeArticleResponse, summary="Vote Not Helpful for Article")
async def vote_not_helpful(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(KnowledgeArticle).options(
        selectinload(KnowledgeArticle.author)
    ).where(KnowledgeArticle.id == id)
    res = await db.execute(stmt)
    art = res.scalars().first()
    if not art:
        raise HTTPException(status_code=404, detail="Knowledge article not found")

    art.not_helpful_count += 1
    await db.commit()
    await db.refresh(art)
    return art
