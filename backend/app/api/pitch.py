import io
import uuid
import json
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.app.db.connection import get_db
from backend.app.db.models import Session, Task, Team, Profile, Blocker
from pydantic import BaseModel
from backend.app.agents.coach import CoachAgent
from backend.app.core.ppt_engine import PPTEngine, Presentation

class PitchOutlineUpdateSchema(BaseModel):
    pitch_outline: dict

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

    # Retrieve blockers
    blockers_res = await db.execute(select(Blocker).where(Blocker.session_id == session_id))
    blockers = [
        {
            "description": b.description,
            "severity": b.severity,
            "status": b.status
        }
        for b in blockers_res.scalars().all()
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
            blockers=blockers,
            team_profile_json=team_data,
            model_preference=model_preference
        ):
            yield chunk
            
    return StreamingResponse(sse_generator(), media_type="text/event-stream")

@router.get("/templates")
async def list_templates():
    from backend.app.core.ppt_engine import PREDEFINED_TEMPLATES
    return {"templates": list(PREDEFINED_TEMPLATES.values())}

@router.post("/analyze-custom-template")
async def analyze_custom_template(
    file: UploadFile = File(...)
):
    if not file.filename.endswith(".pptx"):
        raise HTTPException(status_code=400, detail="Only .pptx files are supported.")
    
    contents = await file.read()
    prs = Presentation(io.BytesIO(contents))
    analysis = PPTEngine.analyze_presentation(prs)
    return {
        "status": "success",
        "filename": file.filename,
        "analysis": analysis
    }

class PPTExportRequestSchema(BaseModel):
    template_id: Optional[str] = "template-1"

@router.post("/export-pptx")
async def export_pptx(
    session_id: uuid.UUID,
    file: Optional[UploadFile] = File(None),
    template_id: str = Form("template-1"),
    db: AsyncSession = Depends(get_db)
):
    sess_res = await db.execute(select(Session).where(Session.id == session_id))
    session = sess_res.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    milestones = session.milestones or []
    tasks_res = await db.execute(select(Task).where(Task.session_id == session_id))
    tasks = [{"name": t.name, "status": t.status, "priority": t.priority} for t in tasks_res.scalars().all()]

    team_data = {}
    if session.team_id:
        team_res = await db.execute(select(Team).where(Team.id == session.team_id))
        team = team_res.scalars().first()
        if team and team.master_json:
            team_data = team.master_json

    def clean_pitch_text(text: str) -> str:
        if not text:
            return ""
        # Strip markdown headings, bold, bullet points
        cleaned = re.sub(r'#+\s*', '', text)
        cleaned = re.sub(r'\*+|\_+', '', cleaned)
        cleaned = re.sub(r'\n+', ' ', cleaned).strip()
        # Return first 180 chars cleanly
        return cleaned[:180] + "..." if len(cleaned) > 180 else cleaned

    pitch_sections = {}
    if session.pitch_outline and isinstance(session.pitch_outline, dict):
        raw = session.pitch_outline.get("full_raw", "")
        cleaned_summary = clean_pitch_text(raw)
        pitch_sections["showcase"] = cleaned_summary or "KAIROS provides an end-to-end execution co-founder."
        pitch_sections["demo"] = cleaned_summary or "Real-time AI workflow engine for execution teams."
        pitch_sections["architecture"] = "FastAPI async backend, Supabase DB, React 19 UI."

    custom_bytes = await file.read() if file else None

    output_bytes = PPTEngine.fill_presentation(
        template_source=template_id,
        session_name=session.name,
        problem_statement=session.problem_statement or "",
        user_idea=session.user_idea or "",
        pitch_sections=pitch_sections,
        milestones=milestones,
        tasks=tasks,
        team_data=team_data,
        custom_pptx_bytes=custom_bytes
    )

    filename = f"{session.name.replace(' ', '_')}_Pitch.pptx"
    return Response(
        content=output_bytes,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.post("/export-pdf")
async def export_pdf(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    sess_res = await db.execute(select(Session).where(Session.id == session_id))
    session = sess_res.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    milestones = session.milestones or []
    tasks_res = await db.execute(select(Task).where(Task.session_id == session_id))
    tasks = [{"name": t.name, "status": t.status, "priority": t.priority} for t in tasks_res.scalars().all()]

    pitch_sections = {}
    if session.pitch_outline and "full_raw" in session.pitch_outline:
        raw = session.pitch_outline["full_raw"]
        pitch_sections["showcase"] = raw
        pitch_sections["demo"] = raw

    pdf_bytes = PPTEngine.generate_pdf(
        session_name=session.name,
        problem_statement=session.problem_statement or "",
        user_idea=session.user_idea or "",
        pitch_sections=pitch_sections,
        milestones=milestones,
        tasks=tasks
    )

    filename = f"{session.name.replace(' ', '_')}_Pitch.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.put("")
async def save_pitch_outline(
    session_id: uuid.UUID,
    data: PitchOutlineUpdateSchema,
    db: AsyncSession = Depends(get_db)
):
    sess_res = await db.execute(select(Session).where(Session.id == session_id))
    session = sess_res.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session.pitch_outline = data.pitch_outline
    await db.commit()
    return {"status": "success", "pitch_outline": session.pitch_outline}
