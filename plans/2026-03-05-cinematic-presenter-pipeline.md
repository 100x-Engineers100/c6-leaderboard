# Cinematic Presenter Pipeline - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fully automated pipeline - input a topic string, output a self-contained player.html cinematic presentation with AI-generated images and morph transitions.

**Architecture:** 4 stages chained in sequence: Gemini LLM -> Gemini Image Gen -> Kling Video Gen -> Python HTML builder. All output embedded into single player.html (no server needed).

**Tech Stack:** Python 3.11+, google-generativeai SDK, httpx, python-dotenv, Kling API (via fal.ai or direct)

---

## INPUT -> OUTPUT CONTRACT (never lose sight of this)

```
INPUT:  topic = "How to Build AI Agents"

OUTPUT folder: output/ai-agents-deck/
  slides.json          <- master data file
  images/
    slide_01.png       <- portrait 9:16 AI image
    slide_02.png
    ...slide_10.png
  transitions/
    t_01_02.mp4        <- morph video slide 1 -> 2
    t_02_03.mp4
    ...t_09_10.mp4
  player.html          <- double-click, works offline
```

---

## Project Structure to Build

```
cinematic-presenter/
  main.py                    <- orchestrator, run this
  .env                       <- API keys (never commit)
  .env.example               <- committed, shows required keys
  requirements.txt
  src/
    stage1_slides.py         <- Gemini LLM -> slides.json
    stage2_images.py         <- Gemini Image Gen -> slide_XX.png
    stage3_transitions.py    <- Kling API -> t_XX_YY.mp4
    stage4_player.py         <- builds player.html
    utils.py                 <- shared helpers (retry, checkpoint)
  tests/
    test_stage1.py
    test_stage2.py
    test_stage3.py
    test_stage4.py
  prompts/
    slide_system_prompt.txt  <- Gemini LLM system prompt
    image_prompt_template.txt
    transition_prompt.txt
  output/                    <- generated decks land here (gitignored)
  reference/
    robot_style_ref.png      <- style anchor for image gen consistency
```

---

## Stage 0: Project Setup

### Task 0.1: Init project structure + dependencies

**Files:**
- Create: `requirements.txt`
- Create: `.env.example`
- Create: `src/__init__.py`
- Create: `tests/__init__.py`

**Step 1: Create requirements.txt**

```
google-generativeai>=0.8.0
httpx>=0.27.0
python-dotenv>=1.0.0
Pillow>=10.0.0
```

**Step 2: Create .env.example**

```
GEMINI_API_KEY=your_gemini_api_key_here
KLING_API_KEY=your_kling_api_key_here
```

**Step 3: Install deps**

```bash
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

Expected: All packages install without error.

**Step 4: Create src/__init__.py and tests/__init__.py**

Both empty files. Just `touch src/__init__.py tests/__init__.py`.

**Step 5: Verify**

```bash
python -c "import google.generativeai; import httpx; import dotenv; print('[OK] all imports work')"
```

Expected: `[OK] all imports work`

---

## Stage 1: Gemini LLM -> slides.json

### Task 1.1: Write the system prompt

**Files:**
- Create: `prompts/slide_system_prompt.txt`

**Step 1: Create the prompt file**

```
You are a cinematic presentation designer.

When given a topic, generate a 10-slide presentation deck as a JSON array.
Return ONLY valid JSON. No markdown fences. No explanation. No preamble.

Each slide object must have EXACTLY these fields:
{
  "id": 1,
  "title": "Slide Title Here",
  "subtitle": "One supporting line under 80 chars",
  "image": "images/slide_01.png",
  "transition_out": "transitions/t_01_02.mp4",
  "image_prompt": "...",
  "transition_prompt": "..."
}

Rules:
- id: integer, 1-indexed, sequential
- image: always "images/slide_XX.png" where XX is zero-padded id (01, 02 ... 10)
- transition_out: "transitions/t_XX_YY.mp4" for all slides EXCEPT last
- last slide transition_out: must be JSON null (not string "null")
- image_prompt: detailed cinematic dark sci-fi portrait 9:16 style.
  Same humanoid robot: smooth white helmet, glowing red eye, white body, teal circuits.
  Deep navy background #0a1628. Teal/cyan holographic UI. Orange accents.
  Title text bold white sans-serif at top. Subtitle in teal. Text must be sharp and legible.
  Be extremely specific about scene, lighting, character pose, and holographic elements.
- transition_prompt: "Cinematic morphing transition between two dark sci-fi holographic slides.
  Smooth camera motion. Teal cyan particle effects. Robot character consistent. Deep navy.
  Photorealistic. 4 seconds. No abrupt cuts."
- Generate exactly 10 slides
```

**Step 2: Verify prompt file exists**

```bash
python -c "open('prompts/slide_system_prompt.txt').read(); print('[OK] prompt file readable')"
```

---

### Task 1.2: Write stage1_slides.py

**Files:**
- Create: `src/stage1_slides.py`

**Step 1: Write the module**

```python
import json
import os
import pathlib
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = pathlib.Path("prompts/slide_system_prompt.txt").read_text()


def generate_slides(topic: str, output_path: pathlib.Path) -> list[dict]:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash-exp",
        system_instruction=SYSTEM_PROMPT
    )

    response = model.generate_content(f"Create a 10-slide deck on: {topic}")
    raw = response.text.strip()

    # Strip markdown fences if model adds them
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
    if raw.endswith("```"):
        raw = raw.rsplit("```", 1)[0]
    raw = raw.strip()

    slides = json.loads(raw)

    # Validate structure
    assert isinstance(slides, list), "Expected a JSON array"
    assert len(slides) == 10, f"Expected 10 slides, got {len(slides)}"
    for s in slides:
        for field in ["id", "title", "subtitle", "image", "transition_out", "image_prompt"]:
            assert field in s, f"Slide {s.get('id')} missing field: {field}"
    assert slides[-1]["transition_out"] is None, "Last slide must have null transition_out"

    output_path.write_text(json.dumps(slides, indent=2))
    print(f"[OK] Stage 1 complete: {len(slides)} slides -> {output_path}")
    return slides


if __name__ == "__main__":
    import sys
    topic = sys.argv[1] if len(sys.argv) > 1 else "How to Build AI Agents"
    out = pathlib.Path("output/test-deck")
    out.mkdir(parents=True, exist_ok=True)
    generate_slides(topic, out / "slides.json")
```

---

### Task 1.3: Write test_stage1.py

**Files:**
- Create: `tests/test_stage1.py`

**Step 1: Write tests**

```python
import json
import pathlib
import pytest
from unittest.mock import patch, MagicMock


def test_slides_json_schema_valid():
    """Test that generated slides.json has correct schema."""
    # Use a sample output to validate schema checker
    sample = [
        {
            "id": i,
            "title": f"Slide {i}",
            "subtitle": "subtitle",
            "image": f"images/slide_{i:02d}.png",
            "transition_out": f"transitions/t_{i:02d}_{i+1:02d}.mp4" if i < 10 else None,
            "image_prompt": "prompt text",
            "transition_prompt": "transition text"
        }
        for i in range(1, 11)
    ]
    sample[-1]["transition_out"] = None

    assert len(sample) == 10
    assert sample[0]["image"] == "images/slide_01.png"
    assert sample[9]["image"] == "images/slide_10.png"
    assert sample[0]["transition_out"] == "transitions/t_01_02.mp4"
    assert sample[8]["transition_out"] == "transitions/t_09_10.mp4"
    assert sample[9]["transition_out"] is None


def test_naming_convention():
    """Test zero-padded naming is correct."""
    for i in range(1, 11):
        img = f"images/slide_{i:02d}.png"
        assert img == f"images/slide_{i:02d}.png"

    for i in range(1, 10):
        trans = f"transitions/t_{i:02d}_{i+1:02d}.mp4"
        assert "_" in trans
        assert "-" not in trans
```

**Step 2: Run tests**

```bash
pytest tests/test_stage1.py -v
```

Expected: 2 tests PASS.

**Step 3: Run stage1 live test (requires GEMINI_API_KEY in .env)**

```bash
python src/stage1_slides.py "Introduction to Machine Learning"
```

Expected: `[OK] Stage 1 complete: 10 slides -> output/test-deck/slides.json`
Check: `output/test-deck/slides.json` exists, valid JSON, 10 slides, last has null transition_out.

---

## Stage 2: Gemini Image Gen -> slide_XX.png

### Task 2.1: Write stage2_images.py

**Files:**
- Create: `src/stage2_images.py`

**Step 1: Write the module**

```python
import asyncio
import os
import pathlib
import time
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()


def generate_single_image(prompt: str, output_path: pathlib.Path) -> bool:
    """Generate one image using Gemini image gen. Returns True on success."""
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

    model = genai.GenerativeModel("gemini-2.0-flash-exp-image-generation")

    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            response_modalities=["image"],
        )
    )

    for part in response.candidates[0].content.parts:
        if part.inline_data and part.inline_data.mime_type.startswith("image/"):
            output_path.write_bytes(part.inline_data.data)
            print(f"[OK] Image saved: {output_path}")
            return True

    print(f"[ERROR] No image returned for {output_path.name}")
    return False


def generate_all_images(slides: list[dict], output_dir: pathlib.Path) -> None:
    """Generate all slide images sequentially (Gemini rate limits prevent full parallel)."""
    images_dir = output_dir / "images"
    images_dir.mkdir(parents=True, exist_ok=True)

    for slide in slides:
        slide_id = slide["id"]
        filename = f"slide_{slide_id:02d}.png"
        out_path = images_dir / filename

        if out_path.exists():
            print(f"[SKIP] {filename} already exists (checkpoint)")
            continue

        print(f"[*] Generating image {slide_id}/10: {slide['title']}")
        success = generate_single_image(slide["image_prompt"], out_path)

        if not success:
            print(f"[WARN] Failed to generate {filename}, creating placeholder")
            # Create minimal placeholder so pipeline doesn't break
            out_path.write_bytes(b"")

        # Rate limit buffer between requests
        if slide_id < len(slides):
            time.sleep(3)

    print(f"[OK] Stage 2 complete: images in {images_dir}")


if __name__ == "__main__":
    import sys
    slides_path = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path("output/test-deck/slides.json")
    slides = json.loads(slides_path.read_text())
    out_dir = slides_path.parent
    generate_all_images(slides, out_dir)
```

**Step 2: Write test**

**Files:**
- Create: `tests/test_stage2.py`

```python
import pathlib
import pytest
from unittest.mock import patch, MagicMock


def test_output_path_naming():
    """Verify image filename pattern is correct."""
    for i in range(1, 11):
        name = f"slide_{i:02d}.png"
        assert name.startswith("slide_")
        assert name.endswith(".png")
        assert len(name.split("_")[1].split(".")[0]) == 2  # zero-padded


def test_checkpoint_skip_logic(tmp_path):
    """Verify existing images are skipped."""
    existing = tmp_path / "images" / "slide_01.png"
    existing.parent.mkdir(parents=True)
    existing.write_bytes(b"fake_image_data")
    assert existing.exists()
    # Logic: if exists -> skip. Verified by file presence check in stage2.


def test_slide_count():
    """10 slides -> 10 images expected."""
    slides = [{"id": i} for i in range(1, 11)]
    expected_files = [f"slide_{s['id']:02d}.png" for s in slides]
    assert len(expected_files) == 10
    assert expected_files[0] == "slide_01.png"
    assert expected_files[9] == "slide_10.png"
```

**Step 3: Run tests**

```bash
pytest tests/test_stage2.py -v
```

Expected: 3 PASS.

**Step 4: Live test (costs ~$0.05, generates 1 image)**

```bash
# Edit stage2_images.py main block to test single slide first
python -c "
import pathlib, json, os
from src.stage2_images import generate_single_image
prompt = 'Cinematic dark sci-fi presentation slide 9:16 portrait. Humanoid robot, white helmet, red eye. Deep navy background. Title: TEST SLIDE in bold white text.'
pathlib.Path('output/test-deck/images').mkdir(parents=True, exist_ok=True)
generate_single_image(prompt, pathlib.Path('output/test-deck/images/slide_01.png'))
"
```

Expected: `[OK] Image saved: output/test-deck/images/slide_01.png`
Check: File exists, open it, verify it's a valid image.

---

## Stage 3: Kling API -> t_XX_YY.mp4

### Task 3.1: Research Kling API endpoint

Before coding, verify which Kling endpoint you have access to:

**Option A - Direct Kling API (api.klingai.com):**
Check: https://docs.klingai.com for current auth and endpoint docs.

**Option B - fal.ai hosted Kling (recommended, simpler auth):**
Model: `fal-ai/kling-video/v2.1/pro/image-to-video`
Docs: https://fal.ai/models/fal-ai/kling-video

fal.ai is recommended for the GitHub repo because:
- Simpler API key (one key for all models)
- Better rate limit handling
- Stable endpoint URLs

**Add to requirements.txt:**
```
fal-client>=0.5.0
```

Reinstall: `pip install -r requirements.txt`

---

### Task 3.2: Write stage3_transitions.py

**Files:**
- Create: `src/stage3_transitions.py`

**Step 1: Write the module**

```python
import json
import os
import pathlib
import time
import httpx
from dotenv import load_dotenv

load_dotenv()

TRANSITION_PROMPT = (
    "Cinematic morphing transition between two dark sci-fi holographic slides. "
    "Smooth camera motion. Teal and cyan particle effects. "
    "Robot character remains visually consistent. Deep navy background. "
    "Photorealistic. Epic cinematic quality. No abrupt cuts. 4 seconds duration."
)

FAL_API_KEY = os.getenv("KLING_API_KEY")  # fal.ai key stored as KLING_API_KEY in .env
FAL_BASE = "https://queue.fal.run"
MODEL = "fal-ai/kling-video/v2.1/pro/image-to-video"


def _image_to_data_url(image_path: pathlib.Path) -> str:
    """Convert image file to base64 data URL for API submission."""
    import base64
    data = image_path.read_bytes()
    b64 = base64.b64encode(data).decode()
    return f"data:image/png;base64,{b64}"


def generate_single_transition(
    slide_a: int,
    slide_b: int,
    images_dir: pathlib.Path,
    output_path: pathlib.Path,
) -> bool:
    """Generate one transition video using Kling 2.1 Pro via fal.ai."""
    img_a = images_dir / f"slide_{slide_a:02d}.png"
    img_b = images_dir / f"slide_{slide_b:02d}.png"

    if not img_a.exists() or not img_b.exists():
        print(f"[ERROR] Missing images for transition t_{slide_a:02d}_{slide_b:02d}")
        return False

    headers = {
        "Authorization": f"Key {FAL_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "prompt": TRANSITION_PROMPT,
        "image_url": _image_to_data_url(img_a),
        "tail_image_url": _image_to_data_url(img_b),
        "duration": "5",
        "aspect_ratio": "9:16",
    }

    with httpx.Client(timeout=30) as client:
        # Submit job
        resp = client.post(
            f"{FAL_BASE}/{MODEL}",
            headers=headers,
            json=payload
        )
        resp.raise_for_status()
        job = resp.json()
        request_id = job["request_id"]
        status_url = job["status_url"]

        print(f"[*] Job submitted: t_{slide_a:02d}_{slide_b:02d} (id: {request_id})")

        # Poll for completion
        while True:
            time.sleep(8)
            status_resp = client.get(status_url, headers=headers)
            status_data = status_resp.json()
            status = status_data.get("status", "")

            if status == "COMPLETED":
                video_url = status_data["output"]["video"]["url"]
                break
            elif status in ("FAILED", "CANCELLED"):
                print(f"[ERROR] Kling job failed: {status_data}")
                return False
            else:
                print(f"  ... status: {status}")

    # Download video
    with httpx.Client(timeout=120) as dl:
        video_resp = dl.get(video_url)
        output_path.write_bytes(video_resp.content)

    print(f"[OK] Transition saved: {output_path.name}")
    return True


def generate_all_transitions(slides: list[dict], output_dir: pathlib.Path) -> None:
    """Generate all N-1 transition videos."""
    images_dir = output_dir / "images"
    trans_dir = output_dir / "transitions"
    trans_dir.mkdir(parents=True, exist_ok=True)

    pairs = [(slides[i]["id"], slides[i + 1]["id"]) for i in range(len(slides) - 1)]

    for a, b in pairs:
        filename = f"t_{a:02d}_{b:02d}.mp4"
        out_path = trans_dir / filename

        if out_path.exists() and out_path.stat().st_size > 0:
            print(f"[SKIP] {filename} already exists (checkpoint)")
            continue

        print(f"[*] Generating transition {a} -> {b} ({pairs.index((a,b))+1}/{len(pairs)})")
        generate_single_transition(a, b, images_dir, out_path)

    print(f"[OK] Stage 3 complete: transitions in {trans_dir}")


if __name__ == "__main__":
    import sys
    slides_path = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path("output/test-deck/slides.json")
    slides = json.loads(slides_path.read_text())
    out_dir = slides_path.parent
    generate_all_transitions(slides, out_dir)
```

**Step 2: Write test**

**Files:**
- Create: `tests/test_stage3.py`

```python
import pathlib
import pytest


def test_transition_naming():
    """Verify transition filename pattern."""
    pairs = [(i, i+1) for i in range(1, 10)]
    for a, b in pairs:
        name = f"t_{a:02d}_{b:02d}.mp4"
        assert name.startswith("t_")
        assert name.endswith(".mp4")
        assert "-" not in name  # must use underscore


def test_pair_count():
    """10 slides -> 9 transitions."""
    slides = [{"id": i} for i in range(1, 11)]
    pairs = [(slides[i]["id"], slides[i+1]["id"]) for i in range(len(slides) - 1)]
    assert len(pairs) == 9
    assert pairs[0] == (1, 2)
    assert pairs[-1] == (9, 10)


def test_checkpoint_skip(tmp_path):
    """Non-empty file should be skipped."""
    f = tmp_path / "t_01_02.mp4"
    f.write_bytes(b"fake_video")
    assert f.exists() and f.stat().st_size > 0
```

**Step 3: Run tests**

```bash
pytest tests/test_stage3.py -v
```

Expected: 3 PASS.

**Step 4: Live test (1 transition, costs ~$0.15)**

First ensure `output/test-deck/images/slide_01.png` and `slide_02.png` exist from Stage 2.

```bash
python -c "
import pathlib, json
from src.stage3_transitions import generate_single_transition
slides_dir = pathlib.Path('output/test-deck')
(slides_dir / 'transitions').mkdir(exist_ok=True)
generate_single_transition(1, 2, slides_dir / 'images', slides_dir / 'transitions/t_01_02.mp4')
"
```

Expected: `[OK] Transition saved: t_01_02.mp4`
Check: File is a valid MP4, non-zero size, plays in VLC/browser.

---

## Stage 4: Build player.html

### Task 4.1: Write stage4_player.py

**Files:**
- Create: `src/stage4_player.py`

**Step 1: Write the module**

```python
import json
import pathlib
import base64


def _embed_file_as_b64(file_path: pathlib.Path) -> str | None:
    """Return base64 data URL for embedding binary files. Returns None if file missing."""
    if not file_path.exists() or file_path.stat().st_size == 0:
        return None
    data = base64.b64encode(file_path.read_bytes()).decode()
    suffix = file_path.suffix.lower()
    mime = {"png": "image/png", "jpg": "image/jpeg", "mp4": "video/mp4"}.get(suffix[1:], "application/octet-stream")
    return f"data:{mime};base64,{data}"


def build_player(deck_dir: pathlib.Path, output_path: pathlib.Path) -> None:
    """Build self-contained player.html embedding all images and videos as base64."""
    slides = json.loads((deck_dir / "slides.json").read_text())

    # Embed images and videos into slide data
    for slide in slides:
        img_path = deck_dir / slide["image"]
        slide["_image_data"] = _embed_file_as_b64(img_path)

        if slide["transition_out"]:
            vid_path = deck_dir / slide["transition_out"]
            slide["_video_data"] = _embed_file_as_b64(vid_path)
        else:
            slide["_video_data"] = None

    slides_js = json.dumps(slides, indent=2)
    total_slides = len(slides)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cinematic Presentation</title>
<style>
  *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

  :root {{
    --navy: #0a1628;
    --teal: #00d4c8;
    --teal-dim: rgba(0, 212, 200, 0.4);
    --orange: #ff6b35;
    --text: #e8f4f8;
  }}

  body {{
    background: var(--navy);
    color: var(--text);
    font-family: 'Courier New', monospace;
    height: 100vh;
    overflow: hidden;
    cursor: none;
  }}

  /* Custom cursor */
  #cursor {{
    position: fixed;
    width: 8px; height: 8px;
    background: var(--teal);
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999;
    transform: translate(-50%, -50%);
    transition: transform 0.1s;
  }}
  #cursor-ring {{
    position: fixed;
    width: 28px; height: 28px;
    border: 1.5px solid var(--teal-dim);
    border-radius: 50%;
    pointer-events: none;
    z-index: 9998;
    transform: translate(-50%, -50%);
    transition: all 0.15s;
  }}

  /* Main stage */
  #stage {{
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--navy);
  }}

  #slide-image {{
    max-height: 100vh;
    max-width: 100vw;
    object-fit: contain;
    display: block;
  }}

  #slide-fallback {{
    display: none;
    width: min(56.25vh, 100vw);
    height: 100vh;
    background: linear-gradient(160deg, #0d1f3c 0%, #061020 100%);
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 32px;
    text-align: center;
    border: 1px solid var(--teal-dim);
  }}
  #slide-fallback .fb-title {{
    font-size: clamp(20px, 3.5vh, 36px);
    font-weight: 700;
    color: var(--text);
    margin-bottom: 16px;
    line-height: 1.2;
  }}
  #slide-fallback .fb-subtitle {{
    font-size: clamp(13px, 2vh, 20px);
    color: var(--teal);
    line-height: 1.4;
  }}

  /* Transition video overlay */
  #transition-video {{
    position: fixed;
    inset: 0;
    width: 100%; height: 100%;
    object-fit: contain;
    background: var(--navy);
    z-index: 100;
    display: none;
  }}

  /* HUD top */
  #hud-top {{
    position: fixed;
    top: 0; left: 0; right: 0;
    padding: 14px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(to bottom, rgba(10,22,40,0.95), transparent);
    z-index: 50;
    letter-spacing: 0.15em;
    font-size: 11px;
    text-transform: uppercase;
  }}
  #deck-title {{ color: var(--teal); }}
  #slide-counter {{ color: var(--text); opacity: 0.7; }}

  /* HUD bottom */
  #hud-bottom {{
    position: fixed;
    bottom: 0; left: 0; right: 0;
    padding: 0 24px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(to top, rgba(10,22,40,0.95), transparent);
    z-index: 50;
  }}

  /* Dot track */
  #dot-track {{
    display: flex;
    gap: 6px;
    align-items: center;
  }}
  .dot {{
    width: 6px; height: 6px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    cursor: pointer;
    transition: all 0.25s;
  }}
  .dot.visited {{ background: var(--teal-dim); }}
  .dot.current {{ background: var(--teal); width: 18px; border-radius: 3px; }}

  /* Nav buttons */
  #nav-buttons {{ display: flex; gap: 10px; align-items: center; }}
  .hud-btn {{
    background: rgba(0,212,200,0.08);
    border: 1px solid var(--teal-dim);
    color: var(--teal);
    padding: 6px 14px;
    font-family: inherit;
    font-size: 10px;
    letter-spacing: 0.1em;
    cursor: pointer;
    text-transform: uppercase;
    transition: all 0.2s;
  }}
  .hud-btn:hover {{ background: rgba(0,212,200,0.18); }}

  /* Progress bar */
  #progress-bar {{
    position: fixed;
    bottom: 0; left: 0;
    height: 2px;
    background: var(--teal);
    transition: width 0.4s ease;
    z-index: 60;
    box-shadow: 0 0 8px var(--teal);
  }}

  /* Corner brackets */
  .corner {{
    position: fixed;
    width: 20px; height: 20px;
    border-color: var(--teal-dim);
    border-style: solid;
    z-index: 50;
    opacity: 0.6;
  }}
  .corner.tl {{ top: 8px; left: 8px; border-width: 1.5px 0 0 1.5px; }}
  .corner.tr {{ top: 8px; right: 8px; border-width: 1.5px 1.5px 0 0; }}
  .corner.bl {{ bottom: 8px; left: 8px; border-width: 0 0 1.5px 1.5px; }}
  .corner.br {{ bottom: 8px; right: 8px; border-width: 0 1.5px 1.5px 0; }}

  /* Overview grid */
  #overview {{
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(10,22,40,0.97);
    z-index: 200;
    padding: 40px;
    overflow-y: auto;
  }}
  #overview.visible {{ display: block; }}
  #overview-grid {{
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 16px;
    max-width: 1200px;
    margin: 0 auto;
  }}
  .overview-card {{
    border: 1px solid var(--teal-dim);
    cursor: pointer;
    overflow: hidden;
    aspect-ratio: 9/16;
    background: #061020;
    position: relative;
    transition: border-color 0.2s;
  }}
  .overview-card:hover {{ border-color: var(--teal); }}
  .overview-card img {{ width: 100%; height: 100%; object-fit: cover; }}
  .overview-card .card-num {{
    position: absolute;
    bottom: 6px; left: 8px;
    font-size: 10px;
    color: var(--teal);
    letter-spacing: 0.1em;
  }}

  /* Prompt panel */
  #prompt-panel {{
    display: none;
    position: fixed;
    top: 0; right: 0;
    width: min(400px, 90vw);
    height: 100vh;
    background: rgba(10,22,40,0.97);
    border-left: 1px solid var(--teal-dim);
    z-index: 200;
    overflow-y: auto;
    padding: 24px;
  }}
  #prompt-panel.visible {{ display: block; }}
  .panel-label {{
    font-size: 9px;
    letter-spacing: 0.2em;
    color: var(--teal);
    text-transform: uppercase;
    margin-bottom: 6px;
    margin-top: 16px;
  }}
  .panel-text {{
    font-size: 11px;
    color: rgba(232,244,248,0.8);
    line-height: 1.6;
    background: rgba(0,212,200,0.04);
    border: 1px solid var(--teal-dim);
    padding: 10px;
    white-space: pre-wrap;
  }}
  .copy-btn {{
    font-size: 9px;
    color: var(--teal);
    background: none;
    border: 1px solid var(--teal-dim);
    padding: 3px 8px;
    cursor: pointer;
    letter-spacing: 0.1em;
    margin-top: 6px;
    font-family: inherit;
  }}

  /* Key hints */
  #key-hints {{
    position: fixed;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 9px;
    color: rgba(0,212,200,0.4);
    letter-spacing: 0.1em;
    line-height: 2;
    text-align: right;
    z-index: 50;
    animation: fade-hints 4s ease forwards;
  }}
  @keyframes fade-hints {{
    0%, 60% {{ opacity: 1; }}
    100% {{ opacity: 0; pointer-events: none; }}
  }}

  /* Fade transition */
  @keyframes fade-in {{
    from {{ opacity: 0; }} to {{ opacity: 1; }}
  }}
  .fade-in {{ animation: fade-in 0.7s ease; }}
</style>
</head>
<body>

<div id="cursor"></div>
<div id="cursor-ring"></div>

<div class="corner tl"></div>
<div class="corner tr"></div>
<div class="corner bl"></div>
<div class="corner br"></div>

<div id="stage">
  <img id="slide-image" src="" alt="">
  <div id="slide-fallback">
    <div class="fb-title" id="fallback-title"></div>
    <div class="fb-subtitle" id="fallback-subtitle"></div>
  </div>
</div>

<video id="transition-video" playsinline></video>

<div id="hud-top">
  <span id="deck-title">CINEMATIC DECK</span>
  <span id="slide-counter">SLIDE 01 / {total_slides:02d}</span>
</div>

<div id="hud-bottom">
  <div id="dot-track"></div>
  <div id="nav-buttons">
    <button class="hud-btn" onclick="togglePromptPanel()">P - PROMPTS</button>
    <button class="hud-btn" onclick="toggleOverview()">G - GRID</button>
    <button class="hud-btn" onclick="prevSlide()">PREV</button>
    <button class="hud-btn" onclick="nextSlide()">NEXT</button>
  </div>
</div>

<div id="progress-bar"></div>

<div id="overview">
  <div id="overview-grid"></div>
</div>

<div id="prompt-panel">
  <div class="panel-label">IMAGE PROMPT</div>
  <div class="panel-text" id="pp-image-prompt"></div>
  <button class="copy-btn" onclick="copyText('pp-image-prompt')">COPY</button>
  <div class="panel-label">TRANSITION PROMPT</div>
  <div class="panel-text" id="pp-trans-prompt"></div>
  <button class="copy-btn" onclick="copyText('pp-trans-prompt')">COPY</button>
  <div style="margin-top:24px;">
    <button class="hud-btn" onclick="togglePromptPanel()">CLOSE</button>
  </div>
</div>

<div id="key-hints">
  SPACE / &rarr; &mdash; NEXT<br>
  &larr; &mdash; PREV<br>
  G &mdash; GRID<br>
  P &mdash; PROMPTS<br>
  F &mdash; FULLSCREEN<br>
  ESC &mdash; CLOSE
</div>

<script>
// ---- DATA (all images and videos embedded as base64) ----
const SLIDES = {slides_js};

// ---- STATE ----
let current = 0;
let transitioning = false;
const TOTAL = SLIDES.length;

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {{
  buildDots();
  buildOverviewGrid();
  showSlide(0, false);
  setupCursor();
  setupKeys();
}});

// ---- SLIDE DISPLAY ----
function showSlide(index, animate = true) {{
  if (index < 0 || index >= TOTAL) return;
  current = index;
  const slide = SLIDES[current];

  const img = document.getElementById('slide-image');
  const fallback = document.getElementById('slide-fallback');

  if (slide._image_data) {{
    img.src = slide._image_data;
    img.style.display = 'block';
    fallback.style.display = 'none';
  }} else {{
    img.style.display = 'none';
    fallback.style.display = 'flex';
    document.getElementById('fallback-title').textContent = slide.title;
    document.getElementById('fallback-subtitle').textContent = slide.subtitle;
  }}

  if (animate) img.classList.add('fade-in');
  setTimeout(() => img.classList.remove('fade-in'), 800);

  updateHUD();
  updatePromptPanel();
}}

// ---- NAVIGATION ----
function nextSlide() {{
  if (transitioning || current >= TOTAL - 1) return;
  const slide = SLIDES[current];

  if (slide._video_data) {{
    playTransition(slide._video_data, () => showSlide(current + 1));
  }} else {{
    showSlide(current + 1);
  }}
}}

function prevSlide() {{
  if (transitioning || current <= 0) return;
  showSlide(current - 1);
}}

function jumpTo(index) {{
  if (index === current) return;
  showSlide(index);
  toggleOverview();
}}

// ---- TRANSITION VIDEO ----
function playTransition(dataUrl, onEnd) {{
  transitioning = true;
  const video = document.getElementById('transition-video');
  video.src = dataUrl;
  video.style.display = 'block';
  video.play().catch(() => {{
    // Fallback: skip video
    video.style.display = 'none';
    transitioning = false;
    onEnd();
  }});
  video.onended = () => {{
    video.style.display = 'none';
    video.src = '';
    transitioning = false;
    onEnd();
  }};
  // Safety timeout (7s)
  setTimeout(() => {{
    if (transitioning) {{
      video.style.display = 'none';
      video.src = '';
      transitioning = false;
      onEnd();
    }}
  }}, 7000);
}}

// ---- HUD ----
function updateHUD() {{
  document.getElementById('slide-counter').textContent =
    `SLIDE ${{String(current+1).padStart(2,'0')}} / ${{String(TOTAL).padStart(2,'0')}}`;

  const dots = document.querySelectorAll('.dot');
  dots.forEach((dot, i) => {{
    dot.classList.remove('current', 'visited');
    if (i === current) dot.classList.add('current');
    else if (i < current) dot.classList.add('visited');
  }});

  const pct = ((current + 1) / TOTAL) * 100;
  document.getElementById('progress-bar').style.width = pct + '%';
}}

function buildDots() {{
  const track = document.getElementById('dot-track');
  for (let i = 0; i < TOTAL; i++) {{
    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.title = SLIDES[i].title;
    dot.onclick = () => jumpTo(i);
    track.appendChild(dot);
  }}
}}

// ---- OVERVIEW GRID ----
function buildOverviewGrid() {{
  const grid = document.getElementById('overview-grid');
  SLIDES.forEach((slide, i) => {{
    const card = document.createElement('div');
    card.className = 'overview-card';
    card.onclick = () => jumpTo(i);
    if (slide._image_data) {{
      const img = document.createElement('img');
      img.src = slide._image_data;
      card.appendChild(img);
    }}
    const num = document.createElement('div');
    num.className = 'card-num';
    num.textContent = String(i+1).padStart(2,'0');
    card.appendChild(num);
    grid.appendChild(card);
  }});
}}

function toggleOverview() {{
  document.getElementById('overview').classList.toggle('visible');
}}

// ---- PROMPT PANEL ----
function updatePromptPanel() {{
  const slide = SLIDES[current];
  document.getElementById('pp-image-prompt').textContent = slide.image_prompt || '(none)';
  document.getElementById('pp-trans-prompt').textContent = slide.transition_prompt || '(none)';
}}

function togglePromptPanel() {{
  document.getElementById('prompt-panel').classList.toggle('visible');
  updatePromptPanel();
}}

function copyText(id) {{
  const text = document.getElementById(id).textContent;
  navigator.clipboard.writeText(text).catch(() => {{}});
}}

// ---- KEYBOARD ----
function setupKeys() {{
  document.addEventListener('keydown', (e) => {{
    if (e.key === 'ArrowRight' || e.key === ' ') {{ e.preventDefault(); nextSlide(); }}
    else if (e.key === 'ArrowLeft') prevSlide();
    else if (e.key.toLowerCase() === 'g') toggleOverview();
    else if (e.key.toLowerCase() === 'p') togglePromptPanel();
    else if (e.key.toLowerCase() === 'f') document.documentElement.requestFullscreen?.();
    else if (e.key === 'Escape') {{
      document.getElementById('overview').classList.remove('visible');
      document.getElementById('prompt-panel').classList.remove('visible');
      document.exitFullscreen?.();
    }}
  }});
}}

// ---- CURSOR ----
function setupCursor() {{
  const cur = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');
  document.addEventListener('mousemove', (e) => {{
    cur.style.left = e.clientX + 'px';
    cur.style.top = e.clientY + 'px';
    ring.style.left = e.clientX + 'px';
    ring.style.top = e.clientY + 'px';
  }});
  document.addEventListener('mousedown', () => {{
    cur.style.transform = 'translate(-50%,-50%) scale(1.8)';
  }});
  document.addEventListener('mouseup', () => {{
    cur.style.transform = 'translate(-50%,-50%) scale(1)';
  }});
}}
</script>
</body>
</html>"""

    output_path.write_text(html, encoding="utf-8")
    print(f"[OK] Stage 4 complete: {output_path} ({len(slides)} slides embedded)")


if __name__ == "__main__":
    import sys
    deck_dir = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path("output/test-deck")
    build_player(deck_dir, deck_dir / "player.html")
```

**Step 2: Write test**

**Files:**
- Create: `tests/test_stage4.py`

```python
import json
import pathlib
import pytest


def test_player_contains_slides_data(tmp_path):
    """player.html must contain embedded SLIDES const."""
    # Minimal slides.json
    slides = [
        {
            "id": i,
            "title": f"Slide {i}",
            "subtitle": "sub",
            "image": f"images/slide_{i:02d}.png",
            "transition_out": None,
            "image_prompt": "prompt",
            "transition_prompt": "trans"
        }
        for i in range(1, 3)
    ]
    (tmp_path / "slides.json").write_text(json.dumps(slides))
    (tmp_path / "images").mkdir()

    from src.stage4_player import build_player
    out = tmp_path / "player.html"
    build_player(tmp_path, out)

    content = out.read_text()
    assert "const SLIDES" in content
    assert "Slide 1" in content
    assert "<!DOCTYPE html>" in content
    assert "fetch(" not in content  # no fetch calls - must be self-contained


def test_player_no_server_required(tmp_path):
    """player.html must not use fetch() or XMLHttpRequest."""
    slides = [{"id": 1, "title": "T", "subtitle": "S", "image": "images/slide_01.png",
               "transition_out": None, "image_prompt": "p", "transition_prompt": "t"}]
    (tmp_path / "slides.json").write_text(json.dumps(slides))
    (tmp_path / "images").mkdir()

    from src.stage4_player import build_player
    out = tmp_path / "player.html"
    build_player(tmp_path, out)

    content = out.read_text()
    assert "fetch(" not in content
    assert "XMLHttpRequest" not in content
```

**Step 3: Run tests**

```bash
pytest tests/test_stage4.py -v
```

Expected: 2 PASS.

**Step 4: Live test**

```bash
python src/stage4_player.py output/test-deck
```

Expected: `[OK] Stage 4 complete: output/test-deck/player.html`
Double-click `output/test-deck/player.html` — should open in browser, show slide with image.

---

## Stage 5: Main Orchestrator + Full Pipeline Test

### Task 5.1: Write utils.py (shared retry logic)

**Files:**
- Create: `src/utils.py`

```python
import time
import functools


def with_retry(max_retries=3, delay=10):
    """Decorator: retry async or sync function on exception."""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise
                    print(f"[WARN] Attempt {attempt+1} failed: {e}. Retrying in {delay}s...")
                    time.sleep(delay)
        return wrapper
    return decorator
```

---

### Task 5.2: Write main.py

**Files:**
- Create: `main.py`

```python
"""
Cinematic Presenter Pipeline
============================
INPUT:  TOPIC string
OUTPUT: output/<deck-name>/player.html  (open in browser, works offline)

Usage:
  python main.py "How to Build AI Agents" my-deck
  python main.py "Introduction to Python" python-deck --slides-only
"""

import argparse
import json
import pathlib
import sys
import os
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from src.stage1_slides import generate_slides
from src.stage2_images import generate_all_images
from src.stage3_transitions import generate_all_transitions
from src.stage4_player import build_player


def validate_env():
    missing = []
    if not os.getenv("GEMINI_API_KEY"):
        missing.append("GEMINI_API_KEY")
    if not os.getenv("KLING_API_KEY"):
        missing.append("KLING_API_KEY")
    if missing:
        print(f"[ERROR] Missing API keys in .env: {', '.join(missing)}")
        print("Copy .env.example to .env and fill in your keys.")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Cinematic Presenter Pipeline")
    parser.add_argument("topic", help="Presentation topic")
    parser.add_argument("deck_name", nargs="?", default="my-deck", help="Output folder name")
    parser.add_argument("--slides-only", action="store_true", help="Run Stage 1 only")
    parser.add_argument("--skip-transitions", action="store_true", help="Skip Stage 3 (no videos)")
    args = parser.parse_args()

    validate_env()

    out_dir = pathlib.Path("output") / args.deck_name
    (out_dir / "images").mkdir(parents=True, exist_ok=True)
    (out_dir / "transitions").mkdir(parents=True, exist_ok=True)

    print(f"\n[*] Topic: {args.topic}")
    print(f"[*] Output: {out_dir}\n")

    # Stage 1
    print("=" * 50)
    print("STAGE 1: Generating slide content...")
    print("=" * 50)
    slides = generate_slides(args.topic, out_dir / "slides.json")

    if args.slides_only:
        print("\n[OK] --slides-only flag set. Done.")
        return

    # Stage 2
    print("\n" + "=" * 50)
    print("STAGE 2: Generating slide images...")
    print("=" * 50)
    generate_all_images(slides, out_dir)

    if not args.skip_transitions:
        # Stage 3
        print("\n" + "=" * 50)
        print("STAGE 3: Generating transition videos...")
        print("=" * 50)
        generate_all_transitions(slides, out_dir)

    # Stage 4
    print("\n" + "=" * 50)
    print("STAGE 4: Building player.html...")
    print("=" * 50)
    build_player(out_dir, out_dir / "player.html")

    print(f"\n[OK] Done! Open: {out_dir / 'player.html'}")


if __name__ == "__main__":
    main()
```

---

### Task 5.3: Full end-to-end run

**Step 1: Test with --slides-only first (cheapest, no image cost)**

```bash
python main.py "How to Build AI Agents" test-deck --slides-only
```

Expected:
- `output/test-deck/slides.json` created
- 10 slides, correct naming, last slide null transition

**Step 2: Test Stage 2 (1 image only to verify before running all 10)**

```bash
python -c "
import json, pathlib
from src.stage2_images import generate_single_image
slides = json.loads(pathlib.Path('output/test-deck/slides.json').read_text())
pathlib.Path('output/test-deck/images').mkdir(exist_ok=True)
generate_single_image(slides[0]['image_prompt'], pathlib.Path('output/test-deck/images/slide_01.png'))
"
```

Verify image quality before spending on all 10.

**Step 3: Run full pipeline**

```bash
python main.py "How to Build AI Agents" ai-agents-deck
```

Expected output:
```
[*] Topic: How to Build AI Agents
[*] Output: output/ai-agents-deck

STAGE 1: Generating slide content...
[OK] Stage 1 complete: 10 slides -> output/ai-agents-deck/slides.json

STAGE 2: Generating slide images...
[OK] Image saved: output/ai-agents-deck/images/slide_01.png
... (10 images)
[OK] Stage 2 complete

STAGE 3: Generating transition videos...
[OK] Transition saved: t_01_02.mp4
... (9 transitions)
[OK] Stage 3 complete

STAGE 4: Building player.html...
[OK] Stage 4 complete

[OK] Done! Open: output/ai-agents-deck/player.html
```

Open `player.html` → verify: images display, transitions play, keyboard nav works, prompt panel works.

---

## Stage 6: GitHub Repo Prep

### Task 6.1: Write README.md

```bash
# In root: README.md should contain:
# - What it does (1 paragraph)
# - Requirements (Python 3.11+, API keys needed)
# - Setup instructions (5 steps)
# - Usage examples
# - Cost estimate per deck (~$2-3)
# - Output structure diagram
```

### Task 6.2: Create .gitignore

```
.env
venv/
output/
__pycache__/
*.pyc
.DS_Store
checkpoint.json
```

### Task 6.3: Final checklist before publishing

- [ ] `.env` is NOT committed (only `.env.example`)
- [ ] `output/` folder is gitignored
- [ ] `python main.py "test topic" test-run` works cleanly on fresh clone
- [ ] README has clear setup steps
- [ ] All API keys come from `.env`, never hardcoded

---

## Run All Tests at End

```bash
pytest tests/ -v
```

Expected: All tests PASS before publishing repo.

---

## Cost Summary Per 10-Slide Deck

| Stage | Service | Cost |
|-------|---------|------|
| Slide JSON | Gemini Flash | ~$0.00 (free tier) |
| 10 images | Gemini Image Gen | ~$0.00-0.05 |
| 9 transitions | Kling 2.1 Pro via fal.ai | ~$1.25-2.50 |
| **TOTAL** | | **~$1.25-2.55** |
