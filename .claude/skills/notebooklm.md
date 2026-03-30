# notebooklm

NotebookLM Integration Skill — create notebooks, add sources (files/URLs), generate deliverables.

## Trigger

Activate when the user asks to:
- Create a NotebookLM notebook
- Send/upload files or URLs to NotebookLM
- Generate infographics, slide decks, flashcards, quizzes, audio, reports, mind maps, or data tables
- Analyze content using NotebookLM
- Use the "notebooklm" skill

## Prerequisites

The user must have authenticated first by running in a **separate terminal**:

```bash
notebooklm login
```

If authentication fails or the client returns auth errors, remind the user to run `notebooklm login` in another terminal.

## How to Use

Run the Python bridge script at `scripts/notebooklm_bridge.py`:

```bash
# Create a new notebook
python3 scripts/notebooklm_bridge.py create "My Research Notebook"

# Add files as sources
python3 scripts/notebooklm_bridge.py add-sources NOTEBOOK_ID "./lecture.pdf" "./notes.txt"

# Add URLs as sources
python3 scripts/notebooklm_bridge.py add-sources NOTEBOOK_ID "https://example.com/article"

# Mix files and URLs
python3 scripts/notebooklm_bridge.py add-sources NOTEBOOK_ID "./file.pdf" "https://example.com"

# Ask a question against the notebook
python3 scripts/notebooklm_bridge.py ask NOTEBOOK_ID "What are the top findings across all sources?"

# Generate artifacts
python3 scripts/notebooklm_bridge.py generate NOTEBOOK_ID infographic --prompt "handwritten chalkboard style"
python3 scripts/notebooklm_bridge.py generate NOTEBOOK_ID slide-deck --output slides.pptx
python3 scripts/notebooklm_bridge.py generate NOTEBOOK_ID flashcards --output cards.json
python3 scripts/notebooklm_bridge.py generate NOTEBOOK_ID quiz
python3 scripts/notebooklm_bridge.py generate NOTEBOOK_ID mind-map --output mindmap.json
python3 scripts/notebooklm_bridge.py generate NOTEBOOK_ID audio --prompt "make it engaging"
python3 scripts/notebooklm_bridge.py generate NOTEBOOK_ID report
python3 scripts/notebooklm_bridge.py generate NOTEBOOK_ID data-table

# List all notebooks
python3 scripts/notebooklm_bridge.py list
```

### Artifact Types
| Type | Description |
|------|-------------|
| `infographic` | Visual infographic (supports style prompts) |
| `slide-deck` | Presentation slides (downloadable as PPTX) |
| `flashcards` | Study flashcards (JSON/Markdown export) |
| `quiz` | Quiz questions with answers |
| `mind-map` | Visual mind map of concepts |
| `audio` | Audio overview / podcast |
| `report` | Written report / briefing document |
| `data-table` | Structured data table (CSV export) |

## Typical Workflow

1. Collect study materials (PDFs, notes, URLs)
2. Create a notebook: `create "Subject Study"`
3. Add all sources: `add-sources NOTEBOOK_ID file1.pdf file2.pdf url1`
4. Ask for analysis: `ask NOTEBOOK_ID "Summarize the key concepts"`
5. Generate deliverables: `generate NOTEBOOK_ID mind-map --output mindmap.json`
