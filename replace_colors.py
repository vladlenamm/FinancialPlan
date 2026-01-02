#!/usr/bin/env python3
import re

# Read the file
with open('/src/app/components/BudgetEnvelopes.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all occurrences
content = content.replace('hover:text-emerald-600', 'hover:text-[#E02F76]')

# Write back
with open('/src/app/components/BudgetEnvelopes.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replaced all occurrences of hover:text-emerald-600 with hover:text-[#E02F76]")
