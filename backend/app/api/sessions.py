import uuid
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import List, Optional
from backend.app.db.connection import get_db
from backend.app.db.models import Session, Profile, Team, Task, Blocker
from backend.app.core.parser import parse_document
from backend.app.agents.coach import CoachAgent

router = APIRouter(prefix="/sessions", tags=["Sessions"])
logger = logging.getLogger("kairos.sessions")

class SessionCreateSchema(BaseModel):
    name: str
    creator_id: uuid.UUID
    team_id: Optional[uuid.UUID] = None

class SessionResponseSchema(BaseModel):
    id: uuid.UUID
    name: str
    creator_id: uuid.UUID
    team_id: Optional[uuid.UUID] = None
    problem_statement: Optional[str] = None
    user_idea: Optional[str] = None
    milestones: Optional[List[dict]] = []
    pitch_outline: Optional[dict] = {}
    status: str
    created_at: str

class RoadmapUpdateSchema(BaseModel):
    milestones: List[dict]

class ChatMessageSchema(BaseModel):
    message: str
    history: List[dict] # [{role: 'user'/'assistant', content: '...'}]
    model_preference: Optional[str] = "claude"

@router.post("", response_model=SessionResponseSchema)
async def create_session(data: SessionCreateSchema, db: AsyncSession = Depends(get_db)):
    # Validate creator profile
    creator_result = await db.execute(select(Profile).where(Profile.id == data.creator_id))
    if not creator_result.scalars().first():
        raise HTTPException(status_code=404, detail="Creator profile not found")
        
    session_id = uuid.uuid4()
    new_session = Session(
        id=session_id,
        name=data.name,
        creator_id=data.creator_id,
        team_id=data.team_id,
        status="planning",
        milestones=[],
        pitch_outline={}
    )
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    
    return SessionResponseSchema(
        id=new_session.id,
        name=new_session.name,
        creator_id=new_session.creator_id,
        team_id=new_session.team_id,
        problem_statement=new_session.problem_statement,
        user_idea=new_session.user_idea,
        milestones=new_session.milestones,
        pitch_outline=new_session.pitch_outline,
        status=new_session.status,
        created_at=str(new_session.created_at)
    )

@router.get("", response_model=List[SessionResponseSchema])
async def list_sessions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Session).order_by(Session.created_at.desc()))
    sessions = result.scalars().all()
    return [
        SessionResponseSchema(
            id=s.id,
            name=s.name,
            creator_id=s.creator_id,
            team_id=s.team_id,
            problem_statement=s.problem_statement,
            user_idea=s.user_idea,
            milestones=s.milestones,
            pitch_outline=s.pitch_outline,
            status=s.status,
            created_at=str(s.created_at)
        ) for s in sessions
    ]

@router.get("/{session_id}", response_model=SessionResponseSchema)
async def get_session(session_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Session).where(Session.id == session_id))
    s = result.scalars().first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionResponseSchema(
        id=s.id,
        name=s.name,
        creator_id=s.creator_id,
        team_id=s.team_id,
        problem_statement=s.problem_statement,
        user_idea=s.user_idea,
        milestones=s.milestones,
        pitch_outline=s.pitch_outline,
        status=s.status,
        created_at=str(s.created_at)
    )

@router.post("/{session_id}/concept")
async def submit_concept(
    session_id: uuid.UUID,
    user_idea: str = Form(...),
    problem_statement_text: Optional[str] = Form(None),
    model_preference: str = Form("claude"),
    problem_statement_file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
):
    # Fetch session
    sess_result = await db.execute(select(Session).where(Session.id == session_id))
    session = sess_result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Extract problem statement text
    prob_text = ""
    if problem_statement_file:
        file_bytes = await problem_statement_file.read()
        prob_text = parse_document(problem_statement_file.filename, file_bytes)
    elif problem_statement_text:
        prob_text = problem_statement_text
        
    session.problem_statement = prob_text
    session.user_idea = user_idea
    await db.commit()
    
    # Compile capabilities profile (master team JSON or solo profile)
    capabilities = {}
    if session.team_id:
        team_result = await db.execute(select(Team).where(Team.id == session.team_id))
        team = team_result.scalars().first()
        if team and team.master_json:
            capabilities = team.master_json
    else:
        # Solo user profile
        prof_result = await db.execute(select(Profile).where(Profile.id == session.creator_id))
        prof = prof_result.scalars().first()
        if prof:
            capabilities = {
                "name": prof.full_name,
                "role": prof.primary_role,
                "level": prof.experience_level,
                "skills": prof.tech_stack
            }
            
    # Define response stream generator
    async def sse_generator():
        # Streams direct output from LLM Coach Agent
        async for chunk in CoachAgent.generate_roadmap(
            hackathon_name=session.name,
            problem_statement=session.problem_statement,
            user_idea=session.user_idea,
            team_profile_json=capabilities,
            model_preference=model_preference
        ):
            yield chunk
            
    return StreamingResponse(sse_generator(), media_type="text/event-stream")

@router.put("/{session_id}/roadmap", response_model=SessionResponseSchema)
async def update_roadmap(
    session_id: uuid.UUID,
    data: RoadmapUpdateSchema,
    db: AsyncSession = Depends(get_db)
):
    sess_result = await db.execute(select(Session).where(Session.id == session_id))
    session = sess_result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Update milestones JSON
    session.milestones = data.milestones
    session.status = "execution" # Lock milestones and switch to execution phase
    await db.commit()
    await db.refresh(session)
    
    # Auto-generate tasks from the milestones if tasks don't exist yet
    task_count_res = await db.execute(select(Task).where(Task.session_id == session_id))
    if not task_count_res.scalars().first():
        # Seed tasks based on deliverables and duration estimate
        for m_idx, m in enumerate(data.milestones):
            task_id = uuid.uuid4()
            title = m.get("title", f"Task {m_idx + 1}")
            deliverable = m.get("deliverable", "Setup baseline code structure")
            phase_id = m.get("phase", f"phase_{m_idx + 1}")
            risk = m.get("risk_level", "medium")
            
            task = Task(
                id=task_id,
                session_id=session_id,
                name=f"{title} - {deliverable}",
                milestone_id=phase_id,
                priority=risk if risk in ["low", "medium", "high"] else "medium",
                status="pending",
                dependencies=[]
            )
            db.add(task)
        await db.commit()
        
    return SessionResponseSchema(
        id=session.id,
        name=session.name,
        creator_id=session.creator_id,
        team_id=session.team_id,
        problem_statement=session.problem_statement,
        user_idea=session.user_idea,
        milestones=session.milestones,
        pitch_outline=session.pitch_outline,
        status=session.status,
        created_at=str(session.created_at)
    )

@router.post("/{session_id}/chat")
async def chat_with_coach(
    session_id: uuid.UUID,
    data: ChatMessageSchema,
    db: AsyncSession = Depends(get_db)
):
    sess_result = await db.execute(select(Session).where(Session.id == session_id))
    session = sess_result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Gather project context
    context = {
        "project_name": session.name,
        "problem_statement": session.problem_statement,
        "user_idea": session.user_idea,
        "milestones": session.milestones,
        "status": session.status
    }
    
    async def sse_generator():
        async for chunk in CoachAgent.chat_coach(
            history=data.history,
            new_message=data.message,
            project_context=context,
            model_preference=data.model_preference
        ):
            yield chunk
            
    return StreamingResponse(sse_generator(), media_type="text/event-stream")
