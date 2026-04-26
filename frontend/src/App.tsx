import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { PublicLayout } from "@/layouts/PublicLayout";
import { CustomerLayout } from "@/layouts/CustomerLayout";
import { WorkerLayout } from "@/layouts/WorkerLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

import Home from "@/pages/Home";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import AdminLogin from "@/pages/auth/AdminLogin";
import Search from "@/pages/customer/Search";
import WorkerProfile from "@/pages/customer/WorkerProfile";
import Booking from "@/pages/customer/Booking";
import JobsList from "@/pages/customer/JobsList";
import JobTracking from "@/pages/customer/JobTracking";
import Chat from "@/pages/customer/Chat";
import CustomerChatList from "@/pages/customer/CustomerChatList";
import CustomerMapPage from "@/pages/customer/MapPage";
import WorkerDashboard from "@/pages/worker/Dashboard";
import WorkerProfilePage from "@/pages/worker/Profile";
import Earnings from "@/pages/worker/Earnings";
import WorkerTrainingsPage from "@/pages/worker/Trainings";
import WorkerChatList from "@/pages/worker/WorkerChatList";
import AdminDashboard from "@/pages/admin/Dashboard";
import WorkerVerification from "@/pages/admin/WorkerVerification";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          {/* Public */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Customer */}
          <Route
            path="/app"
            element={
              <ProtectedRoute role="customer">
                <CustomerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/search" replace />} />
            <Route path="search" element={<Search />} />
            <Route path="map" element={<CustomerMapPage />} />
            <Route path="worker/:id" element={<WorkerProfile />} />
            <Route path="book/:workerId" element={<Booking />} />
            <Route path="jobs" element={<JobsList />} />
            <Route path="jobs/:jobId" element={<JobTracking />} />
            <Route path="messages" element={<CustomerChatList />} />
            <Route path="chat/:chatId" element={<Chat />} />
          </Route>

          {/* Worker */}
          <Route
            path="/worker"
            element={
              <ProtectedRoute role="worker">
                <WorkerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/worker/dashboard" replace />} />
            <Route path="dashboard" element={<WorkerDashboard />} />
            <Route path="profile" element={<WorkerProfilePage />} />
            <Route path="trainings" element={<WorkerTrainingsPage />} />
            <Route path="earnings" element={<Earnings />} />
            <Route path="messages" element={<WorkerChatList />} />
            <Route path="chat/:chatId" element={<Chat />} />
          </Route>

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="verifications" element={<WorkerVerification />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
