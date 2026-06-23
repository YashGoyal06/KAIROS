import json
import logging
from typing import AsyncGenerator
from backend.app.core.router import MultiModelRouter

logger = logging.getLogger("kairos.agents")
router = MultiModelRouter()

class CoachAgent:
    @staticmethod
    async def generate_roadmap(
        hackathon_name: str,
        problem_statement: str,
        user_idea: str,
        team_profile_json: dict,
        model_preference: str = "claude"
    ) -> AsyncGenerator[str, None]:
        """
        Runs the Scope Critique & Roadmap Architect agents.
        Streams the scope critique (freeform text) and appends a structured JSON roadmap.
        """
        system_prompt = (
            "You are KAIROS, a pragmatic, experienced hackathon coach and co-founder.\n"
            "Your job is to critically analyze the user's hackathon idea and output a phased roadmap.\n"
            "Evaluate feasibility for a 24-48 hour hackathon. Do NOT design for a 6-month startup.\n"
            "Recommend cutting features that are too complex. Prioritize a working MVP demo.\n"
            "Utilize the team profile details (roles, tech stack, experience) to distribute tasks fairly and productively.\n\n"
            "OUTPUT STRUCTURE:\n"
            "1. Start by streaming a highly critical, bulleted MVP Critique. Highlight scope risks, missing features, and technical gaps.\n"
            "2. At the very end of your response, write exactly the marker '[ROADMAP_JSON_START]' on a new line.\n"
            "3. Provide a JSON array representing the roadmap milestones. Each milestone must follow this exact JSON schema:\n"
            "[\n"
            "  {\n"
            "    \"phase\": \"Phase 1: MVP Core\",\n"
            "    \"title\": \"Title of Phase\",\n"
            "    \"deliverable\": \"Primary concrete deliverable\",\n"
            "    \"duration_estimate\": \"e.g., 6 hours\",\n"
            "    \"dependencies\": [],\n"
            "    \"risk_level\": \"low|medium|high\"\n"
            "  }\n"
            "]\n"
            "4. End with exactly the marker '[ROADMAP_JSON_END]'. Do not append any other text after the end marker."
        )
        
        prompt = (
            f"Hackathon Name: {hackathon_name}\n"
            f"Problem Statement: {problem_statement}\n"
            f"User's Project Idea: {user_idea}\n"
            f"Team Profile / Member Capabilities: {json.dumps(team_profile_json, indent=2)}\n\n"
            "Please evaluate the concept, critique the scope, suggest cuts, and generate the milestones."
        )
        
        async for chunk in router.stream_complete(system_prompt, prompt, model_preference):
            yield chunk

    @staticmethod
    async def generate_pitch(
        project_name: str,
        problem_statement: str,
        user_idea: str,
        milestones: list,
        tasks: list,
        team_profile_json: dict,
        model_preference: str = "claude"
    ) -> AsyncGenerator[str, None]:
        """
        Runs the Pitch Architect agent to generate Demo Flow, Pitch Outline, and Showcase Slides.
        """
        system_prompt = (
            "You are KAIROS, a master pitch coach for hackathons.\n"
            "Your job is to draft a high-impact presentation structure for judges based on the actual roadmap and team progress.\n"
            "Your output must contain exactly three parts:\n"
            "1. DEMO FLOW: The exact order in which features should be shown live (e.g., 'First, show Google login, then upload data...').\n"
            "2. PITCH OUTLINE: A slide structure (Slide 1: Problem, Slide 2: Solution, etc.) with key talking points.\n"
            "3. FINAL PITCH SHOWCASE: A full presentation script detailing the problem statement, solution, technical architecture, implementation challenges, future scope, and team contributions.\n"
            "Make references to specific team members and their contributions based on task completion and role.\n\n"
            "Stream your response clearly with markdown headers (## Demo Flow, ## Pitch Outline, ## Final Pitch Showcase)."
        )
        
        prompt = (
            f"Project Name: {project_name}\n"
            f"Problem Statement: {problem_statement}\n"
            f"Project Idea: {user_idea}\n"
            f"Roadmap Milestones: {json.dumps(milestones, indent=2)}\n"
            f"Tasks & Completion Progress: {json.dumps(tasks, indent=2)}\n"
            f"Team Strengths: {json.dumps(team_profile_json, indent=2)}\n"
        )
        
        async for chunk in router.stream_complete(system_prompt, prompt, model_preference):
            yield chunk

    @staticmethod
    async def chat_coach(
        history: list,
        new_message: str,
        project_context: dict,
        model_preference: str = "claude"
    ) -> AsyncGenerator[str, None]:
        """
        Standard Q&A coach chat. Allows editing roadmaps or discussing tech stacks.
        """
        system_prompt = (
            "You are KAIROS, the team's AI Hackathon Coach.\n"
            "Your goal is to guide the developers through coding challenges, API configurations, and deployment strategies.\n"
            "Keep your answers short, direct, and pragmatic.\n"
            "If the user asks to modify the roadmap, agree and provide updated suggestions.\n\n"
            f"Project context:\n{json.dumps(project_context, indent=2)}"
        )
        
        # Format history for LLM
        prompt = ""
        for msg in history:
            role = "User" if msg.get("role") == "user" else "Assistant"
            prompt += f"{role}: {msg.get('content')}\n"
        prompt += f"User: {new_message}\nAssistant:"
        
        async for chunk in router.stream_complete(system_prompt, prompt, model_preference):
            yield chunk
