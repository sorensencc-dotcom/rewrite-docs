#!/bin/bash

skillsDir="toolforge/skills"
echo ""
echo "🏥 Skill Health Monitor"
echo ""
echo "Scanning: $skillsDir"
echo ""

if [ ! -d "$skillsDir" ]; then
  echo "⚠️  No toolforge/skills directory found."
  exit 0
fi

total=$(find "$skillsDir" -maxdepth 1 -type d ! -name "_TEMPLATE" ! -name "toolforge" ! -name "$skillsDir" | wc -l)
operational=0
errors=0

echo "Skills Status:"
echo ""

for skillDir in "$skillsDir"/*; do
  [ -d "$skillDir" ] || continue
  skillName=$(basename "$skillDir")
  
  # Skip template and metadata
  [[ "$skillName" == "_TEMPLATE" ]] && continue
  [[ "$skillName" == "MANIFEST"* ]] && continue
  [[ "$skillName" == "SKILLPACK"* ]] && continue
  [[ "$skillName" == "README"* ]] && continue
  [[ "$skillName" == "SYNC"* ]] && continue
  
  status="✅"
  issues=""
  
  # Check for skill.json
  if [ ! -f "$skillDir/skill.json" ]; then
    status="❌"
    issues="$issues\n     - Missing: skill.json"
    errors=$((errors + 1))
  else
    # Check entrypoint (use head -1 to get first match only)
    entrypoint=$(grep -o '"entrypoint"[[:space:]]*:[[:space:]]*"[^"]*"' "$skillDir/skill.json" 2>/dev/null | head -1 | cut -d'"' -f4)
    if [ -z "$entrypoint" ]; then
      status="⚠️"
      issues="$issues\n     - Missing entrypoint in skill.json"
    elif [ ! -f "$skillDir/$entrypoint" ]; then
      status="❌"
      issues="$issues\n     - Entrypoint not found: $entrypoint"
      errors=$((errors + 1))
    fi
    
    # Check category
    category=$(grep -o '"category"[[:space:]]*:[[:space:]]*"[^"]*"' "$skillDir/skill.json" 2>/dev/null | head -1 | cut -d'"' -f4)
    if [ -z "$category" ]; then
      [ "$status" = "✅" ] && status="⚠️"
      issues="$issues\n     - Missing category"
    fi
  fi
  
  [ "$status" = "✅" ] && operational=$((operational + 1))
  
  echo -e "  $status $skillName$issues"
done

total=$((total - 1))  # Exclude _TEMPLATE
percentage=$((operational * 100 / total))

echo ""
echo "📊 Health Score: $percentage/100"
echo "   $operational/$total operational | 0 warnings | $errors errors"
echo ""

if [ $errors -gt 0 ]; then
  echo "❌ Health check failed."
  exit 1
else
  echo "✅ All skills healthy!"
fi
