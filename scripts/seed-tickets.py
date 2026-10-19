#!/usr/bin/env python3
"""
Seed tickets simulation script (Python wrapper)
Executes scripts/seed-tickets.js or equivalent SQL insert for 50 realistic tickets.
"""
import subprocess
import sys
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
js_script = os.path.join(script_dir, "seed-tickets.js")

if os.path.exists(js_script):
    try:
        subprocess.check_call(["node", js_script])
    except Exception as e:
        print(f"Error running seed-tickets.js: {e}", file=sys.stderr)
        sys.exit(1)
else:
    print(f"seed-tickets.js not found at {js_script}", file=sys.stderr)
    sys.exit(1)
