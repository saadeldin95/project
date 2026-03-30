# study-research

Study Research Skill — upload study materials to NotebookLM and generate study aids.

## Trigger

Activate when the user asks to:
- Study a topic or subject
- Create a mind map from files or notes
- Make flashcards or quizzes from study materials
- Upload PDFs, documents, or notes for analysis
- Use the "study-research" skill

## Important

If the user does NOT specify files or a topic, **ask them what files or topic they want to study** before proceeding.

## How to Use

This skill combines file upload with NotebookLM artifact generation.

### Step 1: Create a notebook
```bash
python3 scripts/notebooklm_bridge.py create "Study: [Subject Name]"
```

### Step 2: Add study materials (files or URLs)
```bash
# Add PDF files
python3 scripts/notebooklm_bridge.py add-sources NOTEBOOK_ID "./lecture1.pdf" "./chapter3.pdf"

# Add URLs (articles, docs, etc.)
python3 scripts/notebooklm_bridge.py add-sources NOTEBOOK_ID "https://example.com/article"

# Mix of both
python3 scripts/notebooklm_bridge.py add-sources NOTEBOOK_ID "./notes.pdf" "https://example.com/doc"
```

### Step 3: Ask for analysis
```bash
python3 scripts/notebooklm_bridge.py ask NOTEBOOK_ID "Summarize the key concepts and main themes"
```

### Step 4: Generate study aids
```bash
# Mind map
python3 scripts/notebooklm_bridge.py generate NOTEBOOK_ID mind-map --output mindmap.json

# Flashcards
python3 scripts/notebooklm_bridge.py generate NOTEBOOK_ID flashcards --output cards.json

# Quiz
python3 scripts/notebooklm_bridge.py generate NOTEBOOK_ID quiz

# Infographic
python3 scripts/notebooklm_bridge.py generate NOTEBOOK_ID infographic --prompt "clean and organized study guide style"

# Audio summary (podcast-style)
python3 scripts/notebooklm_bridge.py generate NOTEBOOK_ID audio --prompt "explain like a tutor"

# Full report
python3 scripts/notebooklm_bridge.py generate NOTEBOOK_ID report
```

### Supported File Types
- PDF (.pdf)
- Text files (.txt)
- Google Docs/Slides/Sheets (via URL)
- Web pages (any URL)

## Typical Study Workflow

1. User provides files (PDFs, notes, etc.)
2. Create notebook with descriptive name
3. Upload all files as sources
4. Ask for a summary of key concepts
5. Generate the requested study aid (mind map, flashcards, quiz, etc.)
6. Present results to user
