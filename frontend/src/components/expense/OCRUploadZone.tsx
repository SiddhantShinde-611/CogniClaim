import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn, fileToBase64 } from '../../lib/utils';
import { useOCR } from '../../hooks/useExpenses';
import { OCRResult } from '../../types';

interface Props {
  onExtracted: (result: OCRResult) => void;
}

export function OCRUploadZone({ onExtracted }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const ocrMutation = useOCR();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setStatus('processing');
      setErrorMessage('');

      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      try {
        const base64 = await fileToBase64(file);
        const mimeType = file.type;

        const result = await ocrMutation.mutateAsync({ image_base64: base64, mime_type: mimeType });
        const ocrData: OCRResult = result.data.data;

        setStatus('success');
        onExtracted(ocrData);
      } catch {
        setStatus('error');
        setErrorMessage('Failed to process receipt. Please try again or fill in the form manually.');
      }
    },
    [ocrMutation, onExtracted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
          isDragActive ? 'border-primary bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-surface',
          status === 'processing' && 'pointer-events-none opacity-70',
          status === 'error' && 'border-danger bg-red-50'
        )}
      >
        <input {...getInputProps()} />

        {preview ? (
          <div className="flex items-center gap-4">
            <img
              src={preview}
              alt="Receipt preview"
              className="w-20 h-20 object-cover rounded-lg border border-gray-200"
            />
            <div className="flex-1 text-left">
              {status === 'processing' && (
                <div className="flex items-center gap-2 text-primary">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <p className="text-sm font-medium">Analyzing receipt with AI...</p>
                </div>
              )}
              {status === 'success' && (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="h-5 w-5" />
                  <p className="text-sm font-medium">Receipt analyzed successfully!</p>
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center gap-2 text-danger">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm font-medium">Analysis failed</p>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">Click to upload a different receipt</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            {isDragActive ? (
              <Upload className="h-10 w-10 text-primary" />
            ) : (
              <FileImage className="h-10 w-10 text-gray-300" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-600">
                {isDragActive ? 'Drop your receipt here' : 'Upload receipt for AI extraction'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Drag & drop or click to browse — JPEG, PNG, WebP up to 10MB
              </p>
            </div>
          </div>
        )}
      </div>

      {status === 'error' && errorMessage && (
        <p className="text-xs text-danger bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {errorMessage}
        </p>
      )}

      {status === 'success' && (
        <p className="text-xs text-success bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Fields marked with "Low confidence" may need manual correction. Please review before submitting.
        </p>
      )}
    </div>
  );
}
