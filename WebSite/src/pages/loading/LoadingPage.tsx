import { Loader2 } from "lucide-react";
import React from "react";

const LoadingPage: React.FC = () => {
  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="size-10 animate-spin" />
        <p className="text-lg font-semibold">Đang tải...</p>
      </div>
    </div>
  );
};

export default LoadingPage;
