import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  FileText,
  Music,
  Video
} from 'lucide-react';
import { LessonFile } from '../../types';
import { formatBytes, getFileTypeCategory, downloadBlob, previewBlob } from '../../utils/formatters';

interface FilePreviewModalProps {
  isOpen: boolean;
  file: LessonFile | null;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  file,
  onClose,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && file && file.data) {
      setIsLoading(true);
      setZoomLevel(100);
      setRotation(0);
      setTextContent(null);

      const url = URL.createObjectURL(file.data);
      setObjectUrl(url);

      const isText = file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md');
      if (isText) {
        file.data.text().then(txt => {
          setTextContent(txt);
          setIsLoading(false);
        }).catch(() => {
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }

      return () => {
        URL.revokeObjectURL(url);
        setObjectUrl(null);
      };
    } else {
      setObjectUrl(null);
      setTextContent(null);
    }
  }, [isOpen, file]);

  if (!isOpen || !file) return null;

  const typeInfo = getFileTypeCategory(file.name, file.type);
  const isImage = typeInfo.category === 'image';
  const isPdf = typeInfo.category === 'pdf';
  const isAudio = typeInfo.category === 'audio';
  const isVideo = typeInfo.category === 'video';

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handlePrint = () => {
    if (file.data) {
      previewBlob(file.data);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-5xl h-[90vh] max-h-[850px] bg-slate-900 text-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-800"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Toolbar */}
        <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className={`p-1.5 rounded-lg ${typeInfo.bgDark} flex-shrink-0`}>
              {isAudio ? <Music className="w-4 h-4 text-fuchsia-400" /> : isVideo ? <Video className="w-4 h-4 text-rose-400" /> : <FileText className="w-4 h-4 text-brand-400" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate text-slate-100" title={file.name}>
                {file.name}
              </h3>
              <p className="text-[11px] text-slate-400">
                {`${formatBytes(file.size)} • ${file.type || 'Document'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isImage && (
              <>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-slate-400 min-w-[40px] text-center">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-slate-800 mx-1" />
              </>
            )}

            {file.data && (
              <>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Print File"
                >
                  <Printer className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => previewBlob(file.data)}
                  className="p-1.5 text-slate-400 hover:text-brand-300 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => downloadBlob(file.data, file.originalName || file.name)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                  title="Download"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-slate-950/60 p-4 flex items-center justify-center relative">
          {isLoading && (
            <div className="text-center text-xs text-slate-400 animate-pulse">
              Loading preview...
            </div>
          )}

          {!isLoading && isImage && objectUrl && (
            <div className="max-w-full max-h-full flex items-center justify-center p-2">
              <img
                src={objectUrl}
                alt={file.name}
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease',
                  maxHeight: '75vh',
                  maxWidth: '100%',
                  objectFit: 'contain',
                }}
                className="rounded-lg shadow-lg select-none"
              />
            </div>
          )}

          {!isLoading && isPdf && objectUrl && (
            <iframe
              src={`${objectUrl}#toolbar=1&navpanes=0`}
              title={file.name}
              className="w-full h-full rounded-lg border border-slate-800 bg-white"
            />
          )}

          {!isLoading && isAudio && objectUrl && (
            <div className="p-8 text-center space-y-4 max-w-md">
              <div className="w-16 h-16 rounded-full bg-fuchsia-950/60 text-fuchsia-400 flex items-center justify-center mx-auto">
                <Music className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white">{file.name}</h4>
              <audio src={objectUrl} controls className="w-full" autoPlay />
            </div>
          )}

          {!isLoading && isVideo && objectUrl && (
            <div className="max-w-full max-h-full flex items-center justify-center">
              <video src={objectUrl} controls className="max-h-[70vh] rounded-lg shadow-lg" autoPlay />
            </div>
          )}

          {!isLoading && textContent !== null && (
            <pre className="w-full h-full p-4 font-mono text-xs text-slate-200 bg-slate-900 rounded-lg overflow-auto whitespace-pre-wrap">
              {textContent}
            </pre>
          )}

          {!isLoading && !isImage && !isPdf && !isAudio && !isVideo && textContent === null && (
            <div className="text-center space-y-4 max-w-sm p-6 bg-slate-900 rounded-2xl border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm truncate">{file.name}</h4>
                <p className="text-xs text-slate-400 mt-1">
                  {`This file type (${file.type || 'document'}) can be downloaded or opened directly.`}
                </p>
              </div>
              {file.data && (
                <button
                  type="button"
                  onClick={() => downloadBlob(file.data, file.originalName || file.name)}
                  className="w-full px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg flex items-center justify-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File ({formatBytes(file.size)})</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
