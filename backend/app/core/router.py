import os
import json
import logging
import asyncio
from typing import AsyncGenerator
from anthropic import AsyncAnthropic
import google.generativeai as genai
from huggingface_hub import AsyncInferenceClient
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("kairos.router")

class MultiModelRouter:
    def __init__(self):
        # Initialize clients
        self.claude_key = os.getenv("CLAUDE_API_KEY")
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.hf_key = os.getenv("HF_API_KEY")
        
        self.claude_client = AsyncAnthropic(api_key=self.claude_key) if self.claude_key else None
        
        if self.gemini_key:
            genai.configure(api_key=self.gemini_key)
            
        self.hf_client = AsyncInferenceClient(token=self.hf_key) if self.hf_key else AsyncInferenceClient()

    async def stream_complete(self, system_prompt: str, prompt: str, model_preference: str = "claude") -> AsyncGenerator[str, None]:
        """
        Main entry point for streaming completions.
        Attempts to call the preferred model. If it fails, falls back sequentially:
        Claude -> Gemini -> Hugging Face.
        Yields JSON formatted chunks for SSE.
        """
        chain = ["claude", "gemini", "huggingface"]
        
        # Reorder chain to start with the preferred model
        if model_preference in chain:
            chain.remove(model_preference)
            chain.insert(0, model_preference)
            
        success = False
        last_error = None
        
        for model in chain:
            try:
                logger.info(f"Attempting code completion using model: {model}")
                if model == "claude":
                    async for chunk in self._stream_claude(system_prompt, prompt):
                        yield chunk
                    success = True
                    break
                elif model == "gemini":
                    async for chunk in self._stream_gemini(system_prompt, prompt):
                        yield chunk
                    success = True
                    break
                elif model == "huggingface":
                    async for chunk in self._stream_hf(system_prompt, prompt):
                        yield chunk
                    success = True
                    break
            except Exception as e:
                last_error = e
                logger.error(f"Model {model} failed with error: {str(e)}")
                # Send fallback notification to frontend
                yield f"data: {json.dumps({'type': 'system_info', 'content': f'Notice: Failed to load {model}. Falling back...'})}\n\n"
                await asyncio.sleep(0.5) # Quick breather before retry
                
        if not success:
            logger.critical("All models in the chain failed.")
            yield f"data: {json.dumps({'type': 'error', 'content': f'All LLM backends are currently unavailable. Last error: {str(last_error)}'})}\n\n"

    async def _stream_claude(self, system_prompt: str, prompt: str) -> AsyncGenerator[str, None]:
        if not self.claude_client:
            raise ValueError("Claude API Key not configured.")
            
        response = await self.claude_client.messages.create(
            max_tokens=4000,
            system=system_prompt,
            messages=[{"role": "user", "content": prompt}],
            model="claude-3-5-sonnet-20240620",
            stream=True
        )
        
        async for event in response:
            if event.type == "content_block_delta" and event.delta.type == "text_delta":
                yield f"data: {json.dumps({'type': 'text_delta', 'content': event.delta.text})}\n\n"
                
    async def _stream_gemini(self, system_prompt: str, prompt: str) -> AsyncGenerator[str, None]:
        if not self.gemini_key:
            raise ValueError("Gemini API Key not configured.")
            
        # Combine system prompt with prompt for Gemini
        full_prompt = f"{system_prompt}\n\nUser Request:\n{prompt}"
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        # Execute run in threadpool/async wrapper for streaming
        response = await model.generate_content_async(full_prompt, stream=True)
        async for chunk in response:
            if chunk.text:
                yield f"data: {json.dumps({'type': 'text_delta', 'content': chunk.text})}\n\n"

    async def _stream_hf(self, system_prompt: str, prompt: str) -> AsyncGenerator[str, None]:
        # Fallback to a solid open-source instruction model
        model_name = "Qwen/Qwen2.5-72B-Instruct"
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        # AsyncInferenceClient chat_completion in streaming mode
        stream = await self.hf_client.chat_completion(
            model=model_name,
            messages=messages,
            max_tokens=2048,
            stream=True
        )
        
        async for chunk in stream:
            token = chunk.choices[0].delta.content
            if token:
                yield f"data: {json.dumps({'type': 'text_delta', 'content': token})}\n\n"
