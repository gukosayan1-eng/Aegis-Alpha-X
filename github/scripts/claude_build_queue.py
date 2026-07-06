#!/usr/bin/env python3
import json, os
from pathlib import Path
import anthropic

client=anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
task=sorted(Path("tasks/queue").glob("*.md"))[0]
msg=client.messages.create(
 model="claude-3-5-sonnet-latest",
 max_tokens=8000,
 system='Return only JSON: {"files":[{"path":"","content":""}],"summary":""}',
 messages=[{"role":"user","content":task.read_text()}]
)
raw="".join(b.text for b in msg.content if getattr(b,"type","")=="text").strip()
if raw.startswith("```"):
 raw=raw.split("\n",1)[1].rsplit("```",1)[0]
data=json.loads(raw)
for f in data["files"]:
 p=Path(f["path"]); p.parent.mkdir(parents=True,exist_ok=True); p.write_text(f["content"],encoding="utf-8")
done=Path("tasks/done"); done.mkdir(parents=True,exist_ok=True); task.rename(done/task.name)
log=Path("docs/milestones/CLAUDE_BUILDS.md"); log.parent.mkdir(parents=True,exist_ok=True)
with log.open("a",encoding="utf-8") as fp: fp.write(f"## {task.name}\n{data['summary']}\n")
print("done")
