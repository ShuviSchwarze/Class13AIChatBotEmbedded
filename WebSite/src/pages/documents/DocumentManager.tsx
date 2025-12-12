import React, { useState, useEffect } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  FileText,
  Trash2,
  Download,
  Search,
  ArrowLeft,
  Upload as UploadIcon,
  Calendar,
  FileCode,
  Loader2,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { Separator } from "../../components/ui/separator";
import { fileService, FileInfo } from "../../services/fileService";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { useNavigate } from "react-router";

function DocumentManager() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load files on component mount
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fileService.listFiles();
      setFiles(response.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
      console.error("Error loading files:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      await fileService.uploadFile(file, progress => {
        setUploadProgress(progress);
      });

      // Reload files list
      await loadFiles();
      setUploadProgress(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file");
      console.error("Error uploading file:", err);
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Bạn có chắc muốn xóa file "${filename}"?`)) {
      return;
    }

    try {
      setError(null);
      await fileService.deleteFile(filename);
      // Reload files list
      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete file");
      console.error("Error deleting file:", err);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      await fileService.downloadFile(filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download file");
      console.error("Error downloading file:", err);
    }
  };

  // Group files by date - using file modification from backend (using current date for now)
  const groupedFiles = files.reduce((acc, file) => {
    // For now, group all in today's date since backend doesn't provide timestamp
    const dateKey = new Date().toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(file);
    return acc;
  }, {} as Record<string, FileInfo[]>);

  // Sort dates descending
  const sortedDates = Object.keys(groupedFiles).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  // Filter files by search query
  const filteredDates = sortedDates.filter(date => {
    const filesInDate = groupedFiles[date];
    return filesInDate.some(file =>
      file.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getFileIcon = (extension: string) => {
    const ext = extension.toLowerCase();
    if (ext === ".pdf") return "📄";
    if (ext === ".txt") return "📝";
    if (ext === ".docx" || ext === ".doc") return "📘";
    return "📎";
  };

  const getTotalSize = () => {
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    const totalMB = totalBytes / (1024 * 1024);
    return totalMB < 1 ? `${(totalBytes / 1024).toFixed(1)} KB` : `${totalMB.toFixed(2)} MB`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="size-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-slate-900 dark:text-slate-100">Quản lý Tài liệu</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Tất cả file đã upload trên server
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={loadFiles}
                disabled={loading}
                title="Tải lại danh sách"
              >
                <RefreshCw className={`size-5 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button
                variant="default"
                onClick={() => document.getElementById("file-upload")?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Đang tải lên... {uploadProgress.toFixed(0)}%
                  </>
                ) : (
                  <>
                    <UploadIcon className="size-4 mr-2" />
                    Tải lên file
                  </>
                )}
              </Button>
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                onChange={handleUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileText className="size-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Tổng số file</p>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {files.length}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <UploadIcon className="size-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Dung lượng</p>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {getTotalSize()}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <FileCode className="size-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Loại file</p>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {new Set(files.map(f => f.extension)).size}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Search */}
          <Card className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm file theo tên..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </Card>
        </div>

        {/* Files List */}
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur">
          <ScrollArea className="h-[calc(100vh-400px)]">
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="size-12 text-slate-400 animate-spin mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">Đang tải danh sách file...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                  <FileText className="size-12 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Chưa có tài liệu nào
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Tải lên file PDF, TXT, hoặc DOCX để bắt đầu
                </p>
                <Button onClick={() => document.getElementById("file-upload")?.click()}>
                  <UploadIcon className="size-4 mr-2" />
                  Tải lên file đầu tiên
                </Button>
              </div>
            ) : filteredDates.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-slate-600 dark:text-slate-400">Không tìm thấy file nào</p>
              </div>
            ) : (
              <div className="p-4 space-y-6">
                {filteredDates.map(date => {
                  const filesInDate = groupedFiles[date].filter(file =>
                    file.filename.toLowerCase().includes(searchQuery.toLowerCase())
                  );

                  return (
                    <div key={date}>
                      {/* Date Header */}
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="size-4 text-slate-500" />
                        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {date}
                        </h3>
                        <Separator className="flex-1" />
                        <Badge variant="secondary">{filesInDate.length}</Badge>
                      </div>

                      {/* Files */}
                      <div className="space-y-2 ml-6">
                        {filesInDate.map(file => (
                          <Card
                            key={file.filename}
                            className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="text-2xl mt-1">{getFileIcon(file.extension)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                      {file.filename}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                      <Badge variant="outline" className="text-xs">
                                        {file.extension.toUpperCase().replace(".", "")}
                                      </Badge>
                                      <span className="text-xs text-slate-500">
                                        {formatFileSize(file.size)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8"
                                      title="Tải xuống"
                                      onClick={() => handleDownload(file.filename)}
                                    >
                                      <Download className="size-4 text-slate-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8"
                                      onClick={() => handleDelete(file.filename)}
                                      title="Xóa file"
                                    >
                                      <Trash2 className="size-4 text-red-600" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}

export default DocumentManager;
