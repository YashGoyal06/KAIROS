import uuid
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.app.db.connection import get_db
from backend.app.db.models import Session, Task, Team, Profile
from backend.app.agents.coach import CoachAgent

router = APIRouter(prefix="/sessions/{session_id}/pitch", tags=["Pitch"])
logger = logging.getLogger("kairos.pitch")

@router.post("")
async def generate_pitch_outline(
    session_id: uuid.UUID,
    model_preference: str = "claude",
    db: AsyncSession = Depends(get_db)
):
    # Fetch session
    sess_res = await db.execute(select(Session).where(Session.id == session_id))
    session = sess_res.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Retrieve milestones
    milestones = session.milestones or []
    
    # Retrieve tasks
    tasks_res = await db.execute(select(Task).where(Task.session_id == session_id))
    tasks = [
        {
            "name": t.name,
            "status": t.status,
            "priority": t.priority,
            "assigned_to": str(t.assigned_to)
        }
        for t in tasks_res.scalars().all()
    ]
    
    # Gather team capabilities
    team_data = {}
    if session.team_id:
        team_res = await db.execute(select(Team).where(Team.id == session.team_id))
        team = team_res.scalars().first()
        if team and team.master_json:
            team_data = team.master_json
    else:
        prof_res = await db.execute(select(Profile).where(Profile.id == session.creator_id))
        prof = prof_res.scalars().first()
        if prof:
            team_data = {
                "name": prof.full_name,
                "role": prof.primary_role,
                "level": prof.experience_level,
                "skills": prof.tech_stack
            }
            
    # Stream generator
    async def sse_generator():
        # Streams direct output from CoachAgent's pitch generation
        async for chunk in CoachAgent.generate_pitch(
            project_name=session.name,
            problem_statement=session.problem_statement or "",
            user_idea=session.user_idea or "",
            milestones=milestones,
            tasks=tasks,
            team_profile_json=team_data,
            model_preference=model_preference
        ):
            yield chunk
            
    return StreamingResponse(sse_generator(), media_type="text/event-stream")

@router.put("")
async def save_pitch_outline(
    session_id: uuid.UUID,
    pitch_outline: dict,
    db: AsyncSession = Depends(get_db)
):
    sess_res = await db.execute(select(Session).where(Session.id == session_id))
    session = sess_res.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session.pitch_outline = pitch_outline
    await db.commit()
    return {"status": "success", "pitch_outline": session.pitch_outline}
