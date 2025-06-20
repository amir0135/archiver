import { File } from '../types';

// Smart tag generation based on file patterns
export function generateSmartTags(fileName: string, mimeType: string): string[] {
  const tags: Set<string> = new Set();
  
  // Content type tags
  if (mimeType.includes('document')) tags.add('document');
  if (mimeType.includes('spreadsheet')) tags.add('spreadsheet');
  if (mimeType.includes('presentation')) tags.add('presentation');
  if (mimeType.includes('image')) tags.add('image');
  if (mimeType.includes('pdf')) tags.add('pdf');
  
  // Project-related tags
  if (fileName.toLowerCase().includes('project')) tags.add('project');
  if (fileName.toLowerCase().includes('proposal')) tags.add('proposal');
  if (fileName.toLowerCase().includes('report')) tags.add('report');
  
  // Financial tags
  if (fileName.toLowerCase().includes('budget')) tags.add('financial');
  if (fileName.toLowerCase().includes('invoice')) tags.add('financial');
  
  // Meeting tags
  if (fileName.toLowerCase().includes('meeting')) tags.add('meeting');
  if (fileName.toLowerCase().includes('notes')) tags.add('notes');
  
  return Array.from(tags);
}

// Predict file importance based on patterns
export function predictImportance(file: any): number {
  let score = 0;
  
  // Recent files are more important
  const modifiedDate = new Date(file.modifiedTime);
  const daysSinceModified = (Date.now() - modifiedDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceModified < 7) score += 3;
  else if (daysSinceModified < 30) score += 2;
  
  // File type importance
  if (file.mimeType.includes('document')) score += 2;
  if (file.mimeType.includes('spreadsheet')) score += 2;
  if (file.mimeType.includes('presentation')) score += 2;
  
  // Name-based importance
  const name = file.name.toLowerCase();
  if (name.includes('important')) score += 3;
  if (name.includes('urgent')) score += 3;
  if (name.includes('final')) score += 2;
  if (name.includes('draft')) score -= 1;
  
  return Math.min(Math.max(score, 0), 5); // Normalize between 0-5
}

// Group files by predicted categories
export function predictFileGroups(files: any[]): { [key: string]: any[] } {
  const groups: { [key: string]: any[] } = {
    'Recent Projects': [],
    'Financial Documents': [],
    'Meeting Materials': [],
    'Important Documents': [],
    'Other': []
  };
  
  files.forEach(file => {
    const name = file.name.toLowerCase();
    const importance = predictImportance(file);
    
    if (importance >= 4) {
      groups['Important Documents'].push(file);
      return;
    }
    
    if (name.includes('project') || name.includes('proposal')) {
      groups['Recent Projects'].push(file);
    } else if (name.includes('budget') || name.includes('invoice')) {
      groups['Financial Documents'].push(file);
    } else if (name.includes('meeting') || name.includes('notes')) {
      groups['Meeting Materials'].push(file);
    } else {
      groups['Other'].push(file);
    }
  });
  
  return groups;
}