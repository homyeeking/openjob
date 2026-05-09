const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const cronParser = require('cron-parser');

function parseJob(filePath) {
  const abs = path.resolve(filePath);
  const raw = fs.readFileSync(abs, 'utf8');
  const { data, content } = matter(raw);

  // Validate required fields
  if (!data.name) throw new Error('Missing required field: name');
  if (!data.cron) throw new Error('Missing required field: cron');
  if (!data.description) throw new Error('Missing required field: description');

  // Validate cron expression
  try { cronParser.parseExpression(data.cron); } catch (e) {
    throw new Error(`Invalid cron expression "${data.cron}": ${e.message}`);
  }

  return {
    name: data.name,
    cron: data.cron,
    description: data.description,
    condition: data.condition || '',
    allowedSkills: data.allowedSkills || [],
    timeout: data.timeout || 60,
    retry: data.retry || 0,
    tags: data.tags || [],
    body: content.trim(),
    source: path.relative(process.cwd(), abs)
  };
}

module.exports = { parseJob };
