import { Job } from './types';

export function generatePrompt(job: Partial<Job>): string {
  let prompt = `## Scheduled Job: ${job.name}\n\n${job.description}\n\n`;
  prompt += `### Instructions\n\n`;
  prompt += `Read and follow the instructions in \`${job.source}\`.\n\n`;
  prompt += `- Respect the timeout: ${job.timeout ?? 60} minutes\n`;
  prompt += `- Retry on failure: ${job.retry ?? 0} times\n`;
  prompt += `- Allowed skills: ${job.allowedSkills?.length ? job.allowedSkills.join(', ') : 'all'}\n`;
  prompt += `- Condition: ${job.condition || 'none'}\n\n`;
  prompt += `Execute the job now.`;
  return prompt;
}
