function generatePrompt(job) {
  let prompt = `## Scheduled Job: ${job.name}\n\n${job.description}\n\n`;
  prompt += `### Instructions\n\n`;
  prompt += `Read and follow the instructions in \`${job.source}\`.\n\n`;
  prompt += `- Respect the timeout: ${job.timeout} minutes\n`;
  prompt += `- Retry on failure: ${job.retry} times\n`;
  prompt += `- Allowed skills: ${job.allowedSkills.length ? job.allowedSkills.join(', ') : 'all'}\n`;
  prompt += `- Condition: ${job.condition || 'none'}\n\n`;
  prompt += `Execute the job now.`;
  return prompt;
}

module.exports = { generatePrompt };
