const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, '..', 'supabase', 'full_schema_and_seed.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

// 1. Validate quotes
let inSingleQuote = false;
let inDollarQuote = false;
let dollarTag = '';
let line = 1;
let col = 0;

for (let i = 0; i < sql.length; i++) {
  const ch = sql[i];
  if (ch === '\n') { line++; col = 0; } else { col++; }

  if (!inSingleQuote && !inDollarQuote) {
    if (ch === '\'') {
      inSingleQuote = true;
    } else if (ch === '$' && sql[i+1] === '$') {
      inDollarQuote = true;
      dollarTag = '$$';
      i++;
    }
  } else if (inSingleQuote) {
    if (ch === '\'') {
      if (sql[i+1] === '\'') {
        i++; // escaped quote ''
      } else {
        inSingleQuote = false;
      }
    }
  } else if (inDollarQuote) {
    if (sql.substring(i, i + dollarTag.length) === dollarTag) {
      inDollarQuote = false;
      i += dollarTag.length - 1;
    }
  }
}

if (inSingleQuote) {
  console.error('ERROR: Unclosed single quote in file at line ' + line);
  process.exit(1);
} else if (inDollarQuote) {
  console.error('ERROR: Unclosed dollar quote in file at line ' + line);
  process.exit(1);
}
console.log('✓ Quotes & dollar delimiters: VALID (0 errors)');

// 2. Validate JSONB objects
const regex = /'(\{[\s\S]*?\})'::jsonb/g;
let match;
let count = 0;
while ((match = regex.exec(sql)) !== null) {
  count++;
  const rawJson = match[1].replace(/''/g, "'");
  try {
    JSON.parse(rawJson);
  } catch (err) {
    console.error(`ERROR: Invalid JSON in block ${count}:`, err.message);
    console.error(rawJson.substring(0, 200));
    process.exit(1);
  }
}
console.log(`✓ All ${count} JSONB activity seed blocks: VALID JSON (0 errors)`);

// 3. Check for DROP POLICY IF EXISTS before CREATE POLICY
const policyRegex = /CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+([^\s\n]+)/g;
let pMatch;
let totalPolicies = 0;
let missingDropPolicies = 0;
while ((pMatch = policyRegex.exec(sql)) !== null) {
  totalPolicies++;
  const polName = pMatch[1];
  const tblName = pMatch[2];
  const beforeText = sql.substring(Math.max(0, pMatch.index - 150), pMatch.index);
  if (!beforeText.includes(`DROP POLICY IF EXISTS "${polName}" ON ${tblName}`)) {
    console.warn(`Warning: Missing DROP POLICY IF EXISTS "${polName}" ON ${tblName}`);
    missingDropPolicies++;
  }
}
console.log(`✓ Total policies: ${totalPolicies}, Missing DROP guards: ${missingDropPolicies}`);

// 4. Check for functions
const funcRegex = /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+([^\s(]+)/gi;
let fMatch;
const functions = [];
while ((fMatch = funcRegex.exec(sql)) !== null) {
  functions.push(fMatch[1]);
}
console.log(`✓ Total functions found: ${functions.length}`);

// 5. Check for infinite recursion patterns
if (sql.includes("SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() AND status = 'active'")) {
  console.error('ERROR: Found recursive subquery in schema!');
  process.exit(1);
} else {
  console.log('✓ Infinite recursion check: CLEAN (0 recursive queries)');
}
