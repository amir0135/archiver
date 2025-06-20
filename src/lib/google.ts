// Mock data for testing
const MOCK_FILES = [
  {
    id: 'doc1',
    name: 'Project Proposal.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: '2500000',
    modifiedTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    owners: [{ displayName: 'John Doe' }]
  },
  {
    id: 'ppt1',
    name: 'Quarterly Review.pptx',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    size: '5000000',
    modifiedTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    owners: [{ displayName: 'John Doe' }]
  },
  {
    id: 'img1',
    name: 'Team Photo.jpg',
    mimeType: 'image/jpeg',
    size: '3000000',
    modifiedTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    owners: [{ displayName: 'Jane Smith' }]
  },
  {
    id: 'pdf1',
    name: 'Contract Agreement.pdf',
    mimeType: 'application/pdf',
    size: '1500000',
    modifiedTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    owners: [{ displayName: 'John Doe' }]
  },
  {
    id: 'xls1',
    name: 'Financial Report.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: '1800000',
    modifiedTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    owners: [{ displayName: 'Jane Smith' }]
  }
];

export async function listFiles(accessToken: string) {
  // Return mock data immediately without delay
  return MOCK_FILES;
}