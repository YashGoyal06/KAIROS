import os
import json
import logging
import asyncio
from typing import AsyncGenerator
from huggingface_hub import AsyncInferenceClient
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("kairos.router")

class MultiModelRouter:
    def __init__(self):
        # Initialize clients
        self.hf_key = os.getenv("HF_API_KEY")
        self.hf_client = AsyncInferenceClient(token=self.hf_key) if self.hf_key else AsyncInferenceClient()

    async def stream_complete(self, system_prompt: str, prompt: str, model_preference: str = "deepseek") -> AsyncGenerator[str, None]:
        """
        Main entry point for streaming completions.
        Attempts to call the preferred model. If it fails, falls back sequentially:
        DeepSeek (Ollama) -> Hugging Face.
        Yields JSON formatted chunks for SSE.
        """
        # Map incoming preferences
        pref = model_preference.lower()
        if "deepseek" in pref or "claude" in pref or "gemini" in pref:
            model_preference = "deepseek"
        else:
            model_preference = "huggingface"

        chain = ["deepseek", "huggingface"]
        
        # Reorder chain to start with the preferred model
        if model_preference in chain:
            chain.remove(model_preference)
            chain.insert(0, model_preference)
            
        success = False
        last_error = None
        
        for model in chain:
            try:
                logger.info(f"Attempting code completion using model: {model}")
                if model == "deepseek":
                    async for chunk in self._stream_ollama(system_prompt, prompt):
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

    async def _stream_ollama(self, system_prompt: str, prompt: str) -> AsyncGenerator[str, None]:
        import httpx
        ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
        ollama_model = os.getenv("OLLAMA_MODEL", "deepseek-r1:8b")
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{ollama_url}/api/chat",
                headers={"ngrok-skip-browser-warning": "true"},
                json={
                    "model": ollama_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    "stream": True
                }
            ) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    raise ValueError(f"Ollama error {response.status_code}: {error_text.decode('utf-8', errors='ignore')}")
                
                async for line in response.aiter_lines():
                    if line:
                        try:
                            data = json.loads(line)
                            content = data.get("message", {}).get("content", "")
                            if content:
                                yield f"data: {json.dumps({'type': 'text_delta', 'content': content})}\n\n"
                        except Exception:
                            pass

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

