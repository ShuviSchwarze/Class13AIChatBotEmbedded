import React from "react";
import { useNavigate, useRouteError } from "react-router";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "../../components/ui/button";

const InnerErrorPage: React.FC = () => {
  const navigate = useNavigate();
  const error = useRouteError() as any;

  const handleGoHome = () => {
    navigate("/chat");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-full">
            <AlertTriangle className="size-12 text-red-500" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Đã xảy ra lỗi</h1>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Xin lỗi, không thể tải trang này. Vui lòng thử lại hoặc quay về trang chính.
          </p>

          {error?.message && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300 font-mono">{error.message}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="size-4" />
            Thử lại
          </Button>

          <Button
            onClick={handleGoHome}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Home className="size-4" />
            Về trang chính
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InnerErrorPage;
