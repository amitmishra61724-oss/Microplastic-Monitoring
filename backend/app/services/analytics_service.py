"""
Analytics and Aggregation Service
"""

from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.domain import Sample, AnalysisResult, DetectedParticle

class AnalyticsService:
    @staticmethod
    def get_analysis_by_id(db: Session, analysis_id: int) -> Optional[AnalysisResult]:
        return db.query(AnalysisResult).filter(AnalysisResult.id == analysis_id).first()

    @staticmethod
    def get_analyses(
        db: Session,
        skip: int = 0,
        limit: int = 50,
        sample_id: Optional[int] = None,
        contamination_level: Optional[str] = None
    ) -> List[AnalysisResult]:
        query = db.query(AnalysisResult)
        if sample_id is not None:
            query = query.filter(AnalysisResult.sample_id == sample_id)
        if contamination_level:
            query = query.filter(AnalysisResult.contamination_level == contamination_level.upper())
        return query.order_by(AnalysisResult.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def delete_analysis(db: Session, analysis_id: int) -> bool:
        rec = db.query(AnalysisResult).filter(AnalysisResult.id == analysis_id).first()
        if not rec:
            return False
        db.delete(rec)
        db.commit()
        return True

    @staticmethod
    def get_summary(db: Session) -> Dict[str, Any]:
        total_samples = db.query(Sample).count()
        total_analyses = db.query(AnalysisResult).count()
        
        # Total particles
        total_particles = db.query(func.sum(AnalysisResult.total_particle_count)).scalar() or 0
        
        # Mean concentration
        mean_conc = db.query(func.avg(AnalysisResult.concentration_particles_per_liter)).scalar() or 0.0

        # Risk distribution
        risk_counts = {"LOW": 0, "MODERATE": 0, "HIGH": 0}
        levels = db.query(AnalysisResult.contamination_level, func.count(AnalysisResult.id))\
                   .group_by(AnalysisResult.contamination_level).all()
        for lvl, cnt in levels:
            if lvl in risk_counts:
                risk_counts[lvl] = cnt
            elif lvl:
                risk_counts[lvl.upper()] = cnt

        # Particle type distribution
        types_dist = {"fiber": 0, "fragment": 0, "pellet": 0, "film": 0, "sphere": 0}
        p_types = db.query(DetectedParticle.particle_type, func.count(DetectedParticle.id))\
                    .group_by(DetectedParticle.particle_type).all()
        for p_type, cnt in p_types:
            if p_type in types_dist:
                types_dist[p_type] = cnt
            elif p_type:
                types_dist[p_type] = cnt

        # Recent analyses
        recent = db.query(AnalysisResult).order_by(AnalysisResult.created_at.desc()).limit(5).all()

        return {
            "total_samples": total_samples,
            "total_analyses": total_analyses,
            "total_particles_detected": int(total_particles),
            "mean_concentration_particles_l": round(float(mean_conc), 2),
            "risk_distribution": risk_counts,
            "particle_type_distribution": types_dist,
            "recent_analyses": recent
        }
