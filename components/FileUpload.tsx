import { Upload, X, FileText } from 'lucide-react';
import { useState } from 'react';

interface FileUploadProps {
  onFilesRead: (contents: string[]) => void;
}

export const FileUpload = ({ onFilesRead }: FileUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);

    if (selectedFiles.length > 0) {
      setIsLoading(true);
      try {
        const contents = await Promise.all(
          selectedFiles.map(file => readFileContent(file))
        );
        onFilesRead(contents);
      } catch (error) {
        console.error('파일 읽기 오류:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file, 'UTF-8');
    });
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    
    if (newFiles.length === 0) {
      onFilesRead([]);
    }
  };

  return (
    <div className="space-y-4">
      {/* 파일 업로드 영역 */}
      <label className="block">
        <div className="border-2 border-dashed border-gray-700 hover:border-indigo-500 rounded-lg p-8 text-center cursor-pointer transition-colors">
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-500" />
          <p className="text-gray-300 mb-2">
            <span className="text-indigo-400 font-semibold">클릭하여 파일 선택</span> 또는 드래그 앤 드롭
          </p>
          <p className="text-sm text-gray-500">
            .txt, .md 파일 지원 (여러 파일 선택 가능)
          </p>
          <input
            type="file"
            accept=".txt,.md"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </label>

      {/* 선택된 파일 목록 */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-400">
            선택된 파일 ({files.length}개)
          </p>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-gray-800 p-3 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span className="text-sm text-gray-300">{file.name}</span>
                <span className="text-xs text-gray-500">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-gray-500 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <p className="text-sm text-indigo-400 text-center">
          파일을 읽는 중...
        </p>
      )}
    </div>
  );
};
