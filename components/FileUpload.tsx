import { Upload, X, FileText, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Button } from './Button';

interface FileUploadProps {
  onAnalyze: (contents: string[]) => void;
  isLoading: boolean;
}

export const FileUpload = ({ onAnalyze, isLoading }: FileUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [fileContents, setFileContents] = useState<string[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // 최대 3개 파일 제한
    if (selectedFiles.length > 3) {
      alert('최대 3개의 파일만 업로드 가능합니다.');
      return;
    }
    
    setFiles(selectedFiles);

    if (selectedFiles.length > 0) {
      try {
        const contents = await Promise.all(
          selectedFiles.map(file => readFileContent(file))
        );
        setFileContents(contents);
      } catch (error) {
        console.error('파일 읽기 오류:', error);
        alert('파일을 읽는 중 오류가 발생했습니다.');
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
    const newContents = fileContents.filter((_, i) => i !== index);
    setFiles(newFiles);
    setFileContents(newContents);
  };

  const handleAnalyze = () => {
    if (fileContents.length > 0) {
      onAnalyze(fileContents);
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
            .txt, .md 파일 지원 (최대 3개)
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

      {/* 분석 버튼 */}
      {files.length > 0 && (
        <div className="flex justify-end mt-4">
          <Button
            onClick={handleAnalyze}
            isLoading={isLoading}
            disabled={isLoading || files.length === 0}
            className="w-full md:w-auto"
          >
            <Sparkles size={20} />
            {files.length}개 파일 분석 및 주제 제안받기
          </Button>
        </div>
      )}
    </div>
  );
};
