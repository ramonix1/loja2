import { useEffect, useState } from 'react';

export interface FilePreview {
  file: File;
  url: string;
}

/** Gera object URLs para preview local de arquivos antes do upload. */
export function useImageFilePreviews(files: File[]): FilePreview[] {
  const [previews, setPreviews] = useState<FilePreview[]>([]);

  useEffect(() => {
    const items = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPreviews(items);
    return () => {
      for (const item of items) URL.revokeObjectURL(item.url);
    };
  }, [files]);

  return previews;
}
