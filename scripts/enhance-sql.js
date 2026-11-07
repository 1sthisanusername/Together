const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'supabase', 'full_schema_and_seed.sql');
let sql = fs.readFileSync(srcPath, 'utf8');

// 1. Replace the recursive couple_members subquery with public.get_active_couple_id(auth.uid())
sql = sql.replace(
  /couple_id\s+IN\s+\(\s*SELECT\s+couple_id\s+FROM\s+public\.couple_members\s+WHERE\s+user_id\s*=\s*auth\.uid\(\)\s+AND\s+status\s*=\s*'active'\s*\)/g,
  'couple_id = public.get_active_couple_id(auth.uid())'
);

// Also handle multiline version
sql = sql.replace(
  /couple_id\s+IN\s*\(\s*SELECT\s+couple_id\s+FROM\s+public\.couple_members\s*WHERE\s*user_id\s*=\s*auth\.uid\(\)\s*AND\s*status\s*=\s*'active'\s*\)/gi,
  'couple_id = public.get_active_couple_id(auth.uid())'
);

// 2. Add DROP TRIGGER IF EXISTS for all triggers that lack it
const triggerRegex = /CREATE\s+TRIGGER\s+(\w+)\s+(BEFORE|AFTER)\s+([^\n]+)\s+ON\s+([^\s]+)/gi;
sql = sql.replace(triggerRegex, (match, trName, timing, rest, tableName) => {
  return `DROP TRIGGER IF EXISTS ${trName} ON ${tableName};\nCREATE TRIGGER ${trName} ${timing} ${rest} ON ${tableName}`;
});

// Avoid duplicate drops if already present
sql = sql.replace(/(DROP TRIGGER IF EXISTS (\w+) ON ([^\n;]+);\s*)+DROP TRIGGER IF EXISTS \2 ON \3;/gi, 'DROP TRIGGER IF EXISTS $2 ON $3;');

// 3. Add DROP POLICY IF EXISTS before all CREATE POLICY statements
const policyRegex = /CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+([^\s\n]+)/gi;
sql = sql.replace(policyRegex, (match, polName, tblName) => {
  return `DROP POLICY IF EXISTS "${polName}" ON ${tblName};\nCREATE POLICY "${polName}" ON ${tblName}`;
});

// Avoid duplicate drop policy if already present
sql = sql.replace(/(DROP POLICY IF EXISTS "([^"]+)" ON ([^\n;]+);\s*)+DROP POLICY IF EXISTS "\2" ON \3;/gi, 'DROP POLICY IF EXISTS "$2" ON $3;');

fs.writeFileSync(srcPath, sql, 'utf8');
console.log('Successfully updated full_schema_and_seed.sql with idempotent triggers and policies!');
