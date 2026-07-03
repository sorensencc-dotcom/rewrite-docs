import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./hooks";
import { useWebSocketInvalidation } from "./hooks";
import DesignSystemDashboard from "./index";

function DashboardInner() {
  useWebSocketInvalidation();
  return <DesignSystemDashboard />;
}

export function DashboardWithProvider() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardInner />
    </QueryClientProvider>
  );
}

export default DashboardWithProvider;
