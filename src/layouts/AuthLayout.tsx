import { Card } from "@/components/ui/card";
import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ivento</h1>
          <p className="text-gray-600 mt-2">Simple event management</p>
        </div>

        <Card className="p-4 md:p-6">
          <Outlet />
        </Card>

        <p className="text-center text-sm text-gray-600 mt-6">
          © {new Date().getFullYear()} Ivento. All rights reserved.
        </p>
      </div>
    </div>
  );
}
