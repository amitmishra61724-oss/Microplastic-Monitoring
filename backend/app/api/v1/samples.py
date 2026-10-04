"""
Water Sample Management API Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.domain import SampleCreate, SampleResponse
from app.services.sample_service import SampleService

router = APIRouter(prefix="/samples", tags=["Samples"])

@router.post("", response_model=SampleResponse, status_code=status.HTTP_201_CREATED, summary="Create a new water sample")
def create_sample(sample_in: SampleCreate, db: Session = Depends(get_db)):
    existing = SampleService.get_sample_by_code(db, sample_in.sample_code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sample with code '{sample_in.sample_code}' already exists"
        )
    return SampleService.create_sample(db, sample_in)


@router.get("", response_model=List[SampleResponse], summary="List water samples")
def list_samples(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by sample code or location"),
    db: Session = Depends(get_db)
):
    return SampleService.get_samples(db, skip=skip, limit=limit, search=search)


@router.get("/{sample_id}", response_model=SampleResponse, summary="Get water sample details")
def get_sample(sample_id: int, db: Session = Depends(get_db)):
    sample = SampleService.get_sample_by_id(db, sample_id)
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample with ID {sample_id} not found"
        )
    return sample


@router.delete("/{sample_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete water sample")
def delete_sample(sample_id: int, db: Session = Depends(get_db)):
    deleted = SampleService.delete_sample(db, sample_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample with ID {sample_id} not found"
        )
    return None
