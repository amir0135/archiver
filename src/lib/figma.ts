// Figma API types
interface FigmaFile {
  key: string;
  name: string;
  lastModified: string;
  thumbnailUrl: string;
}

interface FigmaProject {
  id: string;
  name: string;
  files: FigmaFile[];
}

// List Figma files
export async function listFigmaFiles(accessToken: string): Promise<FigmaFile[]> {
  try {
    const response = await fetch('https://api.figma.com/v1/me/files', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Figma files');
    }

    const data = await response.json();
    return data.files.map((file: any) => ({
      key: file.key,
      name: file.name,
      lastModified: file.last_modified,
      thumbnailUrl: file.thumbnail_url
    }));
  } catch (error) {
    console.error('Error fetching Figma files:', error);
    throw error;
  }
}

// Get file details
export async function getFigmaFile(fileKey: string, accessToken: string) {
  try {
    const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Figma file details');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Figma file:', error);
    throw error;
  }
}

// Get file images/assets
export async function getFigmaImages(fileKey: string, ids: string[], accessToken: string) {
  try {
    const response = await fetch(
      `https://api.figma.com/v1/images/${fileKey}?ids=${ids.join(',')}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Figma images');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Figma images:', error);
    throw error;
  }
}