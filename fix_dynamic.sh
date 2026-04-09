#!/bin/bash
for file in $(find src/app -name "page.tsx" -o -name "route.ts"); do
  if ! grep -q "export const dynamic" "$file"; then
    awk '
    /^import / { last_import = NR; lines[NR] = $0; next }
    { lines[NR] = $0 }
    END {
      for (i = 1; i <= NR; i++) {
        print lines[i]
        if (i == last_import) {
          print "\nexport const dynamic = \"force-dynamic\";"
        }
      }
    }' "$file" > tmp.ts && mv tmp.ts "$file"
  fi
done
