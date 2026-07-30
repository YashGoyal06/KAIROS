import os
import io
import re
import logging
from typing import Dict, Any, List, Optional
import pptx
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor

from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

logger = logging.getLogger("kairos.ppt_engine")

TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "ppt_templates")

PREDEFINED_TEMPLATES = {
    "template-1": {
        "id": "template-1",
        "name": "Cyber Neon Executive",
        "file": "Template-1.pptx",
        "description": "High-impact dark theme with neon purple accents. Ideal for AI & Tech Hackathons.",
        "slides_count": 10
    },
    "template-2": {
        "id": "template-2",
        "name": "Minimalist Modern Tech",
        "file": "Template-2.pptx",
        "description": "Clean, structured slide deck with high legibility and sleek grid layouts.",
        "slides_count": 11
    },
    "template-3": {
        "id": "template-3",
        "name": "Vibrant Launchpad",
        "file": "Template-3.pptx",
        "description": "Dynamic layout designed for pitch competitions, featuring prominent metric boxes.",
        "slides_count": 11
    },
    "template-4": {
        "id": "template-4",
        "name": "Enterprise Architecture",
        "file": "Template-4.pptx",
        "description": "Comprehensive design focusing on workflow, technical specs, and milestone flowcharts.",
        "slides_count": 13
    },
    "template-5": {
        "id": "template-5",
        "name": "Futuristic AI Studio",
        "file": "Template-5.pptx",
        "description": "Sleek obsidian gradient deck highlighting AI solution capabilities and team power.",
        "slides_count": 10
    }
}


class PPTEngine:

    @staticmethod
    def get_template_path(template_id: str) -> str:
        t_info = PREDEFINED_TEMPLATES.get(template_id, PREDEFINED_TEMPLATES["template-1"])
        return os.path.join(TEMPLATES_DIR, t_info["file"])

    @staticmethod
    def analyze_presentation(prs: Presentation) -> Dict[str, Any]:
        slide_details = []
        total_shapes = 0
        total_text_frames = 0

        for idx, slide in enumerate(prs.slides):
            text_boxes = []
            for shape in slide.shapes:
                total_shapes += 1
                if shape.has_text_frame:
                    total_text_frames += 1
                    text_content = shape.text_frame.text.strip()
                    if text_content:
                        text_boxes.append({
                            "shape_name": shape.name,
                            "char_count": len(text_content),
                            "sample_text": text_content[:60]
                        })
            
            slide_details.append({
                "slide_number": idx + 1,
                "shape_count": len(slide.shapes),
                "text_box_count": len(text_boxes),
                "sample_content": text_boxes[:3]
            })

        return {
            "slide_count": len(prs.slides),
            "total_shapes": total_shapes,
            "total_text_frames": total_text_frames,
            "slide_width_inches": round(prs.slide_width.inches, 2),
            "slide_height_inches": round(prs.slide_height.inches, 2),
            "slide_details": slide_details
        }

    @staticmethod
    def fit_text_to_frame(text_frame, text: str, max_font_size: int = 16, min_font_size: int = 9, is_title: bool = False):
        """
        PRESERVES PERFECT ALIGNMENT & TYPOGRAPHY:
        Does NOT call text_frame.clear()! Direct run-level text replacement preserves:
        - Frame Margins (Top, Bottom, Left, Right)
        - Vertical Alignment Anchor (Top, Middle, Bottom)
        - Paragraph Alignment (Left, Center, Right, Justify)
        - Paragraph Spacing (space_before, space_after, line_spacing)
        - Run Font Name, Color RGB, Bold, Italic
        """
        text_frame.word_wrap = True
        cleaned = text.strip()
        if not cleaned:
            return

        char_len = len(cleaned)
        
        if is_title:
            if char_len > 80:
                font_size = max(14, max_font_size - 6)
                cleaned = cleaned[:100] + "..." if char_len > 100 else cleaned
            elif char_len > 40:
                font_size = max(16, max_font_size - 4)
            else:
                font_size = max_font_size
        else:
            if char_len > 400:
                font_size = min_font_size
                cleaned = cleaned[:450] + "..."
            elif char_len > 250:
                font_size = max(min_font_size, max_font_size - 5)
            elif char_len > 140:
                font_size = max(min_font_size + 1, max_font_size - 3)
            else:
                font_size = max_font_size

        lines = [line.strip() for line in cleaned.split("\n") if line.strip()]
        if not lines:
            lines = [cleaned]

        existing_paras = list(text_frame.paragraphs)
        if len(existing_paras) == 0:
            p0 = text_frame.add_paragraph()
            existing_paras = [p0]

        ref_p = existing_paras[0]
        ref_alignment = ref_p.alignment
        ref_space_before = ref_p.space_before
        ref_space_after = ref_p.space_after
        ref_line_spacing = ref_p.line_spacing

        ref_color = None
        ref_name = None
        ref_bold = None
        ref_italic = None

        if len(ref_p.runs) > 0:
            r0 = ref_p.runs[0]
            if r0.font and r0.font.color and r0.font.color.type == 1:
                ref_color = r0.font.color.rgb
            if r0.font and r0.font.name:
                ref_name = r0.font.name
            if r0.font and r0.font.bold is not None:
                ref_bold = r0.font.bold
            if r0.font and r0.font.italic is not None:
                ref_italic = r0.font.italic

        # Update existing paragraphs or add new ones without clearing frame
        for i, line in enumerate(lines):
            line_txt = line[2:].strip() if line.startswith(("- ", "* ", "• ")) else line

            if i < len(existing_paras):
                p = existing_paras[i]
            else:
                p = text_frame.add_paragraph()
                if ref_alignment is not None:
                    p.alignment = ref_alignment
                if ref_space_before is not None:
                    p.space_before = ref_space_before
                if ref_space_after is not None:
                    p.space_after = ref_space_after
                if ref_line_spacing is not None:
                    p.line_spacing = ref_line_spacing

            # Update runs directly inside paragraph
            if len(p.runs) > 0:
                p.runs[0].text = line_txt
                p.runs[0].font.size = Pt(font_size)
                if ref_color:
                    p.runs[0].font.color.rgb = ref_color
                if ref_name:
                    p.runs[0].font.name = ref_name
                if ref_bold is not None:
                    p.runs[0].font.bold = ref_bold
                if ref_italic is not None:
                    p.runs[0].font.italic = ref_italic

                # Blank out any extra runs in paragraph
                for extra_r in p.runs[1:]:
                    extra_r.text = ""
            else:
                r = p.add_run()
                r.text = line_txt
                r.font.size = Pt(font_size)
                if ref_color:
                    r.font.color.rgb = ref_color
                if ref_name:
                    r.font.name = ref_name
                if ref_bold is not None:
                    r.font.bold = ref_bold
                if ref_italic is not None:
                    r.font.italic = ref_italic

        # Empty out any unused extra paragraphs in the template shape
        for extra_i in range(len(lines), len(existing_paras)):
            p_extra = existing_paras[extra_i]
            for r_extra in p_extra.runs:
                r_extra.text = ""

    @staticmethod
    def fill_presentation(
        template_source: str,
        session_name: str,
        problem_statement: str,
        user_idea: str,
        pitch_sections: Dict[str, str],
        milestones: List[Dict[str, Any]] = None,
        tasks: List[Dict[str, Any]] = None,
        team_data: Dict[str, Any] = None,
        custom_pptx_bytes: bytes = None
    ) -> bytes:
        """
        In-Place Template Replacement Engine:
        Preserves 100% of designer master graphics, backgrounds, vector shapes, cards, and fonts
        from Template-1.pptx through Template-5.pptx (or user uploaded custom PPTX).
        """
        if custom_pptx_bytes:
            prs = Presentation(io.BytesIO(custom_pptx_bytes))
        else:
            t_path = PPTEngine.get_template_path(template_source)
            if not os.path.exists(t_path):
                # Fallback to Template-1 if path missing
                t_path = os.path.join(TEMPLATES_DIR, "Template-1.pptx")
            prs = Presentation(t_path)

        team_info = team_data or {}
        user_name = team_info.get('name', 'Innovator')
        user_role = team_info.get('role', 'Fullstack Engineer')
        skills = team_info.get('skills', ['Python', 'React'])
        skills_str = ', '.join(skills) if isinstance(skills, list) else str(skills)

        ms_bullets = [f"{m.get('title', 'Milestone')}: {m.get('status', 'In Progress')}" for m in (milestones or [])]
        task_bullets = [f"{t.get('name', 'Task')} [{t.get('priority', 'High')}]" for t in (tasks[:6] if tasks else [])]

        slide_contents = [
            {
                "title": session_name or "Project Pitch",
                "subtitle": user_idea or "AI Hackathon Execution Platform",
                "bullets": ["AI-Driven Co-Founder Engine", "Real-Time Task Syncing", "Zero-Overflow Slide Generation"]
            },
            {
                "title": "Problem Statement & Vision",
                "subtitle": problem_statement or "Addressing hackathon project planning and execution challenges.",
                "bullets": ["Loss of project momentum during hackathons", "Unstructured milestone management", "Manual pitch slide design overhead"]
            },
            {
                "title": "Core Solution & Product Demo",
                "subtitle": pitch_sections.get("demo", "Real-time AI workflow engine for execution teams."),
                "bullets": ["Interactive AI Coach Room", "Task Board with AI Blocker Assistance", "Instant PPTX & PDF Presentation Suite"]
            },
            {
                "title": "System Architecture & Stack",
                "subtitle": pitch_sections.get("architecture", "FastAPI backend, Supabase DB, React 19 UI."),
                "bullets": ["FastAPI Async Backend", "Supabase Database & Auth", "Claude LLM Broker & Agents"]
            },
            {
                "title": "Roadmap & Execution Plan",
                "subtitle": "Sprint Milestones",
                "bullets": ms_bullets if ms_bullets else ["Phase 1: Architecture & DB Setup", "Phase 2: AI Coach & Task Sync", "Phase 3: Presentation Studio Export"]
            },
            {
                "title": "Sprint Tasks & Progress",
                "subtitle": "Execution Metrics",
                "bullets": task_bullets if task_bullets else ["Task 1: Supabase Setup", "Task 2: AI Scope Review", "Task 3: Slide Export Engine"]
            },
            {
                "title": "Team & Technical Mastery",
                "subtitle": f"Lead: {user_name} ({user_role})",
                "bullets": [f"Lead: {user_name}", f"Role: {user_role}", f"Skills: {skills_str}"]
            },
            {
                "title": "Pitch Showcase & Impact",
                "subtitle": pitch_sections.get("showcase", "KAIROS provides an end-to-end execution co-founder."),
                "bullets": ["Reduces pitch compilation time by 90%", "Guarantees zero text overflow across all templates", "Professional PPTX and PDF output streams"]
            },
            {
                "title": "Risk Mitigation & Support",
                "subtitle": "Resilience Strategy",
                "bullets": ["LLM rate-limit fallback routing", "Resilient database connection pools", "Validated slide placeholder mapping"]
            },
            {
                "title": "Conclusion & Next Steps",
                "subtitle": "Ready for Live Execution",
                "bullets": ["Launch local servers", "Test live presentation decks", "Submit project to judges"]
            }
        ]

        EXCLUDE_PATTERNS = [
            'ingoude company', 'fradel and spies', 'thynk unlimited',
            'hello@', 'www.', '+123', '25 august', '27 - 12', 'december',
            '123 anywhere', '(001)', '(002)', '(003)', 'manager', 'staf',
            'presented to', 'website :'
        ]
        
        TITLE_KEYWORDS = [
            'pitch deck', 'the problem', 'the solution', 'company roadmap',
            'service overview', 'target market', 'financial projections',
            'current investor', 'our team', 'thank you', 'intro-duction',
            'problem statement', 'our solution', 'market research',
            'product overview', 'unique value proposition', 'business model',
            'traction our progress', 'pitch deck presentation', 'thank you so much!'
        ]

        for slide_idx, slide in enumerate(prs.slides):
            c_data = slide_contents[slide_idx] if slide_idx < len(slide_contents) else {
                "title": f"Project Insight {slide_idx + 1}",
                "subtitle": pitch_sections.get("slides", "Comprehensive pitch execution overview."),
                "bullets": ["Key technical metric 1", "Key technical metric 2", "Key technical metric 3"]
            }

            text_shapes = [s for s in slide.shapes if s.has_text_frame]

            title_shape = None
            subtitle_shape = None
            body_shapes = []

            for shape in text_shapes:
                txt = shape.text_frame.text.strip()
                txt_lower = txt.lower()

                # Protect presenter branding name
                if 'presented by' in txt_lower:
                    PPTEngine.fit_text_to_frame(shape.text_frame, f"Presented By : {user_name}", max_font_size=12, min_font_size=8, is_title=False)
                    continue

                # Protect all other header/footer branding elements
                if any(ep in txt_lower for ep in EXCLUDE_PATTERNS):
                    continue

                top_pos = shape.top.inches if hasattr(shape, 'top') else 0

                # Match Slide Title
                if any(tk in txt_lower for tk in TITLE_KEYWORDS) or (top_pos >= 2.5 and top_pos <= 4.5 and len(txt) < 35):
                    if not title_shape:
                        title_shape = shape
                    elif not subtitle_shape:
                        subtitle_shape = shape
                    else:
                        body_shapes.append(shape)
                elif 'presentation' in txt_lower or 'pitch deck' in txt_lower or (top_pos > 4.5 and top_pos < 6.0 and len(txt) < 30):
                    if not subtitle_shape:
                        subtitle_shape = shape
                    else:
                        body_shapes.append(shape)
                else:
                    body_shapes.append(shape)

            # 1. Update Title Shape cleanly
            if title_shape:
                PPTEngine.fit_text_to_frame(title_shape.text_frame, c_data["title"], max_font_size=24, min_font_size=14, is_title=True)

            # 2. Update Subtitle Shape cleanly
            if subtitle_shape:
                PPTEngine.fit_text_to_frame(subtitle_shape.text_frame, c_data["subtitle"], max_font_size=14, min_font_size=10, is_title=False)

            # 3. Distribute Bullets across Body / Card shapes
            if body_shapes:
                bullets = c_data["bullets"]
                if len(body_shapes) == 1:
                    body_text = c_data["subtitle"] + "\n\n" + "\n".join([f"• {b}" for b in bullets])
                    PPTEngine.fit_text_to_frame(body_shapes[0].text_frame, body_text, max_font_size=13, min_font_size=9, is_title=False)
                else:
                    for idx, b_shape in enumerate(body_shapes):
                        if idx < len(bullets):
                            card_text = bullets[idx]
                        else:
                            card_text = c_data["subtitle"]
                        PPTEngine.fit_text_to_frame(b_shape.text_frame, card_text, max_font_size=12, min_font_size=8, is_title=False)

        output_stream = io.BytesIO()
        prs.save(output_stream)
        output_stream.seek(0)
        return output_stream.getvalue()

    @staticmethod
    def generate_pdf(
        session_name: str,
        problem_statement: str,
        user_idea: str,
        pitch_sections: Dict[str, str],
        milestones: List[Dict[str, Any]] = None,
        tasks: List[Dict[str, Any]] = None
    ) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(letter),
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'SlideTitle',
            parent=styles['Heading1'],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#a855f7'),
            spaceAfter=12
        )
        
        body_style = ParagraphStyle(
            'SlideBody',
            parent=styles['BodyText'],
            fontSize=11,
            leading=16,
            textColor=colors.HexColor('#334155'),
            spaceAfter=10
        )
        
        bullet_style = ParagraphStyle(
            'SlideBullet',
            parent=body_style,
            leftIndent=15,
            firstLineIndent=-10
        )

        story = []

        # Slide 1: Cover
        story.append(Paragraph(f"<b>{session_name or 'Project Presentation'}</b>", title_style))
        story.append(Spacer(1, 15))
        story.append(Paragraph(f"<b>Vision:</b> {user_idea or 'AI-Powered Project Co-Founder & Execution Engine'}", body_style))
        story.append(Spacer(1, 20))
        story.append(Paragraph("Generated by KAIROS Pitch Studio", body_style))
        story.append(PageBreak())

        # Slide 2: Problem Statement
        story.append(Paragraph("<b>Problem Statement & Core Value</b>", title_style))
        story.append(Spacer(1, 10))
        story.append(Paragraph(problem_statement or "Addressing hackathon project planning and execution challenges.", body_style))
        story.append(PageBreak())

        # Slide 3: Demo Flow
        story.append(Paragraph("<b>Demo Flow & Core User Experience</b>", title_style))
        story.append(Spacer(1, 10))
        demo_text = pitch_sections.get("demo", "Step 1: Onboarding\nStep 2: AI Coach Roadmap\nStep 3: Execution Task Board\nStep 4: Pitch Studio Export")
        for line in demo_text.split("\n"):
            if line.strip():
                story.append(Paragraph(f"• {line.strip()}", bullet_style))
        story.append(PageBreak())

        # Slide 4: Milestones & Roadmap
        story.append(Paragraph("<b>Roadmap & Milestones</b>", title_style))
        story.append(Spacer(1, 10))
        if milestones:
            table_data = [["Milestone", "Status", "Target Output"]]
            for m in milestones:
                table_data.append([
                    m.get('title', 'Milestone'),
                    m.get('status', 'Planning'),
                    m.get('deliverable', 'Code & Demo')
                ])
            t = Table(table_data, colWidths=[250, 150, 250])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#6b21a8')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0,0), (-1,0), 8),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ]))
            story.append(t)
        else:
            story.append(Paragraph("1. Phase 1: MVP Architecture & Database Setup", bullet_style))
            story.append(Paragraph("2. Phase 2: AI Execution Coach Integration", bullet_style))
            story.append(Paragraph("3. Phase 3: Final Pitch Suite & Showcase", bullet_style))

        story.append(PageBreak())

        # Slide 5: Pitch Showcase Script
        story.append(Paragraph("<b>Final Pitch Script & Call to Action</b>", title_style))
        story.append(Spacer(1, 10))
        showcase_text = pitch_sections.get("showcase", "KAIROS empowers teams to turn hackathon ideas into functional products efficiently.")
        story.append(Paragraph(showcase_text, body_style))

        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()
