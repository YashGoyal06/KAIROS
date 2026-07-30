import os
import io
import re
import logging
from typing import Dict, Any, List, Optional
import pptx
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
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
        ZERO-OVERRIDE Text Replacement:
        Replaces text content ONLY. Never touches:
        - Font Size (keeps original 124.8pt, 25pt, 20pt, 15pt etc. from template)
        - Font Name (keeps Poppins Bold, Aileron, Aileron Bold, etc.)
        - Font Bold / Italic state
        - Font Color RGB
        - Paragraph Alignment (LEFT, CENTER, RIGHT, JUSTIFY)
        - Paragraph Spacing (space_before, space_after, line_spacing)
        - Frame Margins & Vertical Anchor
        """
        text_frame.word_wrap = True
        cleaned = text.strip()
        if not cleaned:
            return

        # Truncate if text is way too long for slide boxes
        if len(cleaned) > 500:
            cleaned = cleaned[:500] + "..."

        lines = [line.strip() for line in cleaned.split("\n") if line.strip()]
        if not lines:
            lines = [cleaned]

        existing_paras = list(text_frame.paragraphs)
        if len(existing_paras) == 0:
            return

        # Snapshot reference font properties from first run of first paragraph
        ref_size = None
        ref_color = None
        ref_name = None
        ref_bold = None
        ref_italic = None
        ref_alignment = existing_paras[0].alignment
        ref_space_before = existing_paras[0].space_before
        ref_space_after = existing_paras[0].space_after
        ref_line_spacing = existing_paras[0].line_spacing

        if len(existing_paras[0].runs) > 0:
            r0 = existing_paras[0].runs[0]
            ref_size = r0.font.size  # KEEP EXACT ORIGINAL SIZE (e.g. 124.8pt, 15pt)
            if r0.font.color and r0.font.color.type == 1:
                ref_color = r0.font.color.rgb
            ref_name = r0.font.name
            if r0.font.bold is not None:
                ref_bold = r0.font.bold
            if r0.font.italic is not None:
                ref_italic = r0.font.italic

        # Replace text in existing paragraphs run-by-run
        for i, line in enumerate(lines):
            line_txt = line[2:].strip() if line.startswith(("- ", "* ", "• ")) else line

            if i < len(existing_paras):
                p = existing_paras[i]
                # Replace text in first run, blank extra runs
                if len(p.runs) > 0:
                    p.runs[0].text = line_txt
                    for extra_r in p.runs[1:]:
                        extra_r.text = ""
                else:
                    # No runs exist, add one with reference font props
                    r = p.add_run()
                    r.text = line_txt
                    if ref_size:
                        r.font.size = ref_size
                    if ref_color:
                        r.font.color.rgb = ref_color
                    if ref_name:
                        r.font.name = ref_name
                    if ref_bold is not None:
                        r.font.bold = ref_bold
                    if ref_italic is not None:
                        r.font.italic = ref_italic
            else:
                # Need a new paragraph beyond what template has
                p = text_frame.add_paragraph()
                if ref_alignment is not None:
                    p.alignment = ref_alignment
                if ref_space_before is not None:
                    p.space_before = ref_space_before
                if ref_space_after is not None:
                    p.space_after = ref_space_after
                if ref_line_spacing is not None:
                    p.line_spacing = ref_line_spacing
                r = p.add_run()
                r.text = line_txt
                if ref_size:
                    r.font.size = ref_size
                if ref_color:
                    r.font.color.rgb = ref_color
                if ref_name:
                    r.font.name = ref_name
                if ref_bold is not None:
                    r.font.bold = ref_bold
                if ref_italic is not None:
                    r.font.italic = ref_italic

        # Blank out unused extra paragraphs
        for extra_i in range(len(lines), len(existing_paras)):
            p_extra = existing_paras[extra_i]
            for r_extra in p_extra.runs:
                r_extra.text = ""

    @staticmethod
    def render_slides_as_images(pptx_bytes: bytes, scale: float = 1.5) -> list:
        """
        Convert each slide in a PPTX to a PNG image using Pillow.
        Extracts text shapes with their exact positions, sizes, font properties
        and renders them onto a canvas matching slide dimensions.
        Returns list of base64-encoded PNG strings.
        """
        import base64
        from PIL import Image, ImageDraw, ImageFont

        prs = Presentation(io.BytesIO(pptx_bytes))
        slide_w_px = int(prs.slide_width.inches * 96 * scale)
        slide_h_px = int(prs.slide_height.inches * 96 * scale)
        emu_to_px = lambda emu: int(emu / 914400 * 96 * scale)

        slide_images = []

        for slide in prs.slides:
            # Create white slide canvas
            img = Image.new('RGB', (slide_w_px, slide_h_px), (255, 255, 255))
            draw = ImageDraw.Draw(img)

            # Check slide background fill color
            bg = slide.background
            if bg and bg.fill and bg.fill.type is not None:
                try:
                    fc = bg.fill.fore_color
                    if fc and fc.type == 1:
                        rgb = fc.rgb
                        bg_color = (rgb[0] if isinstance(rgb[0], int) else int(str(rgb)[:2], 16),
                                    rgb[1] if isinstance(rgb[1], int) else int(str(rgb)[2:4], 16),
                                    rgb[2] if isinstance(rgb[2], int) else int(str(rgb)[4:6], 16))
                        draw.rectangle([(0, 0), (slide_w_px, slide_h_px)], fill=bg_color)
                except Exception:
                    pass

            # Render each text shape
            for shape in slide.shapes:
                if not shape.has_text_frame:
                    continue
                tf = shape.text_frame
                txt = tf.text.strip()
                if not txt:
                    continue

                x = emu_to_px(shape.left)
                y = emu_to_px(shape.top)
                w = emu_to_px(shape.width)
                h = emu_to_px(shape.height)

                # Gather all lines with their font properties
                for para in tf.paragraphs:
                    line_text = ""
                    font_size_px = 16
                    font_color = (50, 50, 50)
                    is_bold = False

                    for run in para.runs:
                        if not run.text:
                            continue
                        line_text += run.text

                        # Get font size
                        if run.font.size:
                            raw_pt = run.font.size / 12700
                            # Cap display size for rendering (huge title fonts)
                            capped_pt = min(raw_pt, 72)
                            font_size_px = int(capped_pt * scale)

                        # Get font color
                        try:
                            if run.font.color and run.font.color.type == 1:
                                c = run.font.color.rgb
                                cs = str(c)
                                font_color = (int(cs[0:2], 16), int(cs[2:4], 16), int(cs[4:6], 16))
                        except Exception:
                            pass

                        if run.font.bold:
                            is_bold = True

                    if not line_text.strip():
                        y += font_size_px + 4
                        continue

                    # Try to load a suitable font
                    try:
                        if is_bold:
                            pil_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size_px)
                        else:
                            pil_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size_px)
                    except Exception:
                        try:
                            pil_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", font_size_px)
                        except Exception:
                            pil_font = ImageFont.load_default()

                    # Word-wrap text to fit within shape width
                    wrapped_lines = PPTEngine._word_wrap(draw, line_text.strip(), pil_font, w - 8)

                    for wl in wrapped_lines:
                        # Determine x based on paragraph alignment
                        text_x = x + 4
                        try:
                            bbox = draw.textbbox((0, 0), wl, font=pil_font)
                            text_w = bbox[2] - bbox[0]
                            if para.alignment == PP_ALIGN.CENTER:
                                text_x = x + (w - text_w) // 2
                            elif para.alignment == PP_ALIGN.RIGHT:
                                text_x = x + w - text_w - 4
                        except Exception:
                            pass

                        if y < slide_h_px:
                            draw.text((text_x, y), wl, fill=font_color, font=pil_font)
                        y += font_size_px + 4

            # Convert to base64 PNG
            buf = io.BytesIO()
            img.save(buf, format='PNG', quality=92)
            buf.seek(0)
            b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
            slide_images.append(b64)

        return slide_images

    @staticmethod
    def _word_wrap(draw, text: str, font, max_width: int) -> list:
        """Word-wrap text to fit within max_width pixels."""
        words = text.split(' ')
        lines = []
        current_line = ""
        for word in words:
            test_line = f"{current_line} {word}".strip()
            try:
                bbox = draw.textbbox((0, 0), test_line, font=font)
                line_w = bbox[2] - bbox[0]
            except Exception:
                line_w = len(test_line) * 8
            if line_w <= max_width:
                current_line = test_line
            else:
                if current_line:
                    lines.append(current_line)
                current_line = word
        if current_line:
            lines.append(current_line)
        return lines if lines else [text]

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
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header banner on pages after cover
        if self._pageNumber > 1:
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(36, 756, 576, 756)
            self.drawString(36, 762, "KAIROS AI EXECUTION ENGINE | HACKATHON PROJECT REPORT")

        # Footer line & page numbers
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(36, 40, 576, 40)
        
        self.setFont("Helvetica", 8)
        self.drawString(36, 26, "Generated automatically by KAIROS Execution Engine")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(576, 26, page_text)
        self.restoreState()


    @staticmethod
    def generate_project_pdf(
        session_name: str,
        problem_statement: str = "",
        user_idea: str = "",
        milestones: List[Dict[str, Any]] = None,
        tasks: List[Dict[str, Any]] = None,
        blockers: List[Dict[str, Any]] = None,
        team_data: Dict[str, Any] = None,
        pitch_sections: Dict[str, str] = None,
        created_at: str = None
    ) -> bytes:
        milestones = milestones or []
        tasks = tasks or []
        blockers = blockers or []
        team_data = team_data or {}
        pitch_sections = pitch_sections or {}

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=54,
            bottomMargin=54
        )

        styles = getSampleStyleSheet()
        
        # Custom Typography Styles
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#6d28d9'),
            spaceAfter=6
        )

        section_title_style = ParagraphStyle(
            'SectionTitle',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=13,
            leading=17,
            textColor=colors.HexColor('#1e1b4b'),
            spaceBefore=14,
            spaceAfter=6,
            keepWithNext=True
        )

        body_style = ParagraphStyle(
            'ReportBody',
            parent=styles['BodyText'],
            fontName='Helvetica',
            fontSize=9.5,
            leading=13.5,
            textColor=colors.HexColor('#334155'),
            spaceAfter=6
        )

        callout_style = ParagraphStyle(
            'ReportCallout',
            parent=body_style,
            fontName='Helvetica-Oblique',
            fontSize=9.5,
            leading=13.5,
            textColor=colors.HexColor('#1e293b'),
            backColor=colors.HexColor('#f8fafc'),
            borderColor=colors.HexColor('#7c3aed'),
            borderWidth=1,
            borderPadding=8,
            spaceAfter=10
        )

        table_cell_style = ParagraphStyle(
            'TableCell',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=11.5,
            textColor=colors.HexColor('#1e293b')
        )

        table_header_style = ParagraphStyle(
            'TableHeader',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8.5,
            leading=11.5,
            textColor=colors.white
        )

        story = []

        # Document Header Banner
        header_table = Table(
            [[Paragraph(f"<b>KAIROS EXECUTION BLUEPRINT</b>", ParagraphStyle('H1', parent=table_header_style, fontSize=15, leading=18)),
              Paragraph(f"Project: <b>{session_name}</b>", ParagraphStyle('H2', parent=table_header_style, fontSize=10, alignment=2))]],
            colWidths=[300, 240]
        )
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#6d28d9')),
            ('PADDING', (0,0), (-1,-1), 10),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 12))

        # KPI Summary Cards Table
        total_tasks = len(tasks)
        completed_tasks = sum(1 for t in tasks if t.get('status') == 'completed')
        pct = int((completed_tasks / total_tasks * 100)) if total_tasks > 0 else 0
        open_blockers = sum(1 for b in blockers if b.get('status') == 'open')

        kpi_data = [
            [
                Paragraph(f"<font size=7.5 color='#64748b'>MILESTONES</font><br/><font size=15 color='#6d28d9'><b>{len(milestones)}</b></font>", table_cell_style),
                Paragraph(f"<font size=7.5 color='#64748b'>COMPLETED TASKS</font><br/><font size=15 color='#059669'><b>{completed_tasks}/{total_tasks}</b></font>", table_cell_style),
                Paragraph(f"<font size=7.5 color='#64748b'>PROGRESS</font><br/><font size=15 color='#2563eb'><b>{pct}%</b></font>", table_cell_style),
                Paragraph(f"<font size=7.5 color='#64748b'>OPEN BLOCKERS</font><br/><font size=15 color='#dc2626'><b>{open_blockers}</b></font>", table_cell_style)
            ]
        ]
        kpi_table = Table(kpi_data, colWidths=[135, 135, 135, 135])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e2e8f0')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('PADDING', (0,0), (-1,-1), 6),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ]))
        story.append(kpi_table)
        story.append(Spacer(1, 14))

        # Section 1: Executive Summary & Project Vision
        story.append(Paragraph("1. Executive Summary & Project Vision", section_title_style))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#7c3aed"), spaceAfter=8))

        if problem_statement:
            story.append(Paragraph(f"<b>Problem Statement:</b><br/>{problem_statement}", callout_style))
        
        if user_idea:
            story.append(Paragraph(f"<b>Proposed Solution & Architecture:</b><br/>{user_idea}", body_style))

        # Section 2: Team Roster & Skill Matrix
        if team_data:
            story.append(Spacer(1, 8))
            story.append(Paragraph("2. Team Structure & Skill Alignment", section_title_style))
            story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#7c3aed"), spaceAfter=6))
            
            members = team_data.get("members", [])
            if not members and "name" in team_data:
                members = [team_data]
                
            if members:
                t_rows = [[
                    Paragraph("<b>Member Name</b>", table_header_style),
                    Paragraph("<b>Role</b>", table_header_style),
                    Paragraph("<b>Level</b>", table_header_style),
                    Paragraph("<b>Tech Stack Skills</b>", table_header_style)
                ]]
                for m in members:
                    skills_str = ", ".join(m.get("skills", [])) if isinstance(m.get("skills"), list) else str(m.get("skills", "N/A"))
                    t_rows.append([
                        Paragraph(m.get("full_name") or m.get("name") or "User", table_cell_style),
                        Paragraph(m.get("role") or m.get("primary_role") or "Developer", table_cell_style),
                        Paragraph(m.get("level") or m.get("experience_level") or "Mid", table_cell_style),
                        Paragraph(skills_str or "Fullstack", table_cell_style)
                    ])
                t_team = Table(t_rows, colWidths=[120, 100, 80, 240])
                t_team.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e1b4b')),
                    ('PADDING', (0,0), (-1,-1), 5),
                    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
                ]))
                story.append(t_team)

        # Section 3: Strategic Roadmap & Execution Milestones
        story.append(Spacer(1, 10))
        story.append(Paragraph("3. Strategic Roadmap & Execution Milestones", section_title_style))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#7c3aed"), spaceAfter=6))

        if milestones:
            m_rows = [[
                Paragraph("<b>Phase</b>", table_header_style),
                Paragraph("<b>Milestone Title</b>", table_header_style),
                Paragraph("<b>Key Deliverable</b>", table_header_style),
                Paragraph("<b>Est. Duration</b>", table_header_style)
            ]]
            for m in milestones:
                m_rows.append([
                    Paragraph(m.get('phase', 'Phase'), table_cell_style),
                    Paragraph(f"<b>{m.get('title', '')}</b>", table_cell_style),
                    Paragraph(m.get('deliverable', 'Code & Architecture'), table_cell_style),
                    Paragraph(m.get('duration_estimate', '2-4 hrs'), table_cell_style)
                ])
            m_table = Table(m_rows, colWidths=[80, 180, 200, 80])
            m_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#6d28d9')),
                ('PADDING', (0,0), (-1,-1), 5),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ]))
            story.append(m_table)

        # Section 4: Complete Task Execution Log
        story.append(Spacer(1, 10))
        story.append(Paragraph("4. Comprehensive Task Execution Matrix", section_title_style))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#7c3aed"), spaceAfter=6))

        if tasks:
            task_rows = [[
                Paragraph("<b>Task Name</b>", table_header_style),
                Paragraph("<b>Priority</b>", table_header_style),
                Paragraph("<b>Status</b>", table_header_style)
            ]]
            for idx, t in enumerate(tasks):
                status_val = (t.get('status') or 'pending').lower()
                status_color = '#059669' if status_val == 'completed' else '#dc2626' if status_val == 'blocked' else '#d97706' if status_val == 'in_progress' else '#2563eb'
                status_text = f"<font color='{status_color}'><b>{status_val.upper()}</b></font>"

                prio_val = (t.get('priority') or 'medium').upper()
                prio_color = '#dc2626' if prio_val == 'HIGH' else '#7c3aed' if prio_val == 'MEDIUM' else '#0284c7'
                prio_text = f"<font color='{prio_color}'><b>{prio_val}</b></font>"

                task_rows.append([
                    Paragraph(t.get('name', 'Task'), table_cell_style),
                    Paragraph(prio_text, table_cell_style),
                    Paragraph(status_text, table_cell_style)
                ])
            task_table = Table(task_rows, colWidths=[340, 100, 100])
            task_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e1b4b')),
                ('PADDING', (0,0), (-1,-1), 4),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#ffffff'), colors.HexColor('#f8fafc')])
            ]))
            story.append(task_table)

        # Section 5: Blockers & Mitigation Log
        if blockers:
            story.append(Spacer(1, 10))
            story.append(Paragraph("5. Technical Blockers & Mitigation Strategies", section_title_style))
            story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#7c3aed"), spaceAfter=6))

            b_rows = [[
                Paragraph("<b>Blocker Description</b>", table_header_style),
                Paragraph("<b>Severity</b>", table_header_style),
                Paragraph("<b>Status</b>", table_header_style)
            ]]
            for b in blockers:
                b_rows.append([
                    Paragraph(b.get('description', ''), table_cell_style),
                    Paragraph(b.get('severity', 'medium').upper(), table_cell_style),
                    Paragraph(b.get('status', 'open').upper(), table_cell_style)
                ])
            b_table = Table(b_rows, colWidths=[360, 90, 90])
            b_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#991b1b')),
                ('PADDING', (0,0), (-1,-1), 5),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#fee2e2')),
            ]))
            story.append(b_table)

        # Section 6: Presentation Suite & Stage Script
        raw_pitch = pitch_sections.get("full_raw") or pitch_sections.get("showcase") or ""
        if raw_pitch:
            story.append(PageBreak())
            story.append(Paragraph("6. Presentation Suite & Verbal Stage Script", section_title_style))
            story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#7c3aed"), spaceAfter=8))

            lines = raw_pitch.split("\n")
            for line in lines:
                l_str = line.strip()
                if not l_str:
                    story.append(Spacer(1, 3))
                elif l_str.startswith("#"):
                    clean_h = re.sub(r'#+\s*', '', l_str)
                    story.append(Paragraph(f"<b>{clean_h}</b>", ParagraphStyle('PitchH', parent=section_title_style, fontSize=11, leading=15, spaceBefore=6, spaceAfter=3)))
                elif l_str.startswith("-") or l_str.startswith("*"):
                    clean_bullet = l_str[1:].strip()
                    story.append(Paragraph(f"• {clean_bullet}", ParagraphStyle('PitchBullet', parent=body_style, leftIndent=12, firstLineIndent=-8)))
                else:
                    story.append(Paragraph(l_str, body_style))

        doc.build(story, canvasmaker=NumberedCanvas)
        buffer.seek(0)
        return buffer.getvalue()

    @staticmethod
    def generate_pdf(
        session_name: str,
        problem_statement: str = "",
        user_idea: str = "",
        pitch_sections: Dict[str, str] = None,
        milestones: List[Dict[str, Any]] = None,
        tasks: List[Dict[str, Any]] = None
    ) -> bytes:
        return PPTEngine.generate_project_pdf(
            session_name=session_name,
            problem_statement=problem_statement,
            user_idea=user_idea,
            milestones=milestones,
            tasks=tasks,
            pitch_sections=pitch_sections
        )
