import React from "react";
import { AlertTriangle } from "lucide-react";

const ErrorPage: React.FC = () => {
  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <AlertTriangle className="size-16 text-red-500" />
        <h1 className="text-2xl font-bold text-gray-800">Đã xảy ra lỗi</h1>
        <p className="text-lg text-gray-600 max-w-md">
          Xin lỗi, đã có lỗi xảy ra trong hệ thống. Vui lòng thử lại sau hoặc liên hệ với bộ phận hỗ
          trợ.
        </p>
      </div>
    </div>
  );
};

export default ErrorPage;
