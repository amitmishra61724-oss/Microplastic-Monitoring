"""
Water Sample Management Service
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.domain import Sample
from app.schemas.domain import SampleCreate

class SampleService:
    @staticmethod
    def get_sample_by_id(db: Session, sample_id: int) -> Optional[Sample]:
        return db.query(Sample).filter(Sample.id == sample_id).first()

    @staticmethod
    def get_sample_by_code(db: Session, sample_code: str) -> Optional[Sample]:
        return db.query(Sample).filter(Sample.sample_code == sample_code).first()

    @staticmethod
    def get_samples(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None
    ) -> List[Sample]:
        query = db.query(Sample)
        if search:
            search_fmt = f"%{search}%"
            query = query.filter(
                or_(
                    Sample.sample_code.ilike(search_fmt),
                    Sample.location.ilike(search_fmt)
                )
            )
        return query.order_by(Sample.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def create_sample(db: Session, sample_in: SampleCreate) -> Sample:
        db_sample = Sample(
            sample_code=sample_in.sample_code,
            location=sample_in.location,
            volume_ml=sample_in.volume_ml,
            notes=sample_in.notes
        )
        db.add(db_sample)
        db.commit()
        db.refresh(db_sample)
        return db_sample

    @staticmethod
    def delete_sample(db: Session, sample_id: int) -> bool:
        sample = db.query(Sample).filter(Sample.id == sample_id).first()
        if not sample:
            return False
        db.delete(sample)
        db.commit()
        return True
