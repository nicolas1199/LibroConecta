import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import PrivateRoute from "../components/PrivateRoute";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import PublishBook from "../pages/PublishBook";
import Explore from "../pages/Explore";
import MyLibrary from "../pages/MyLibrary";
import AddToLibrary from "../pages/AddToLibrary";
import EditLibraryBook from "../pages/EditLibraryBook";
import LibraryInsights from "../pages/LibraryInsights";
import Matches from "../pages/Matches";
import Messages from "../pages/Messages";
import Ratings from "../pages/Ratings";
import Favorites from "../pages/Favorites";
import Wishlist from "../pages/Wishlist";
import Drafts from "../pages/Drafts";
import History from "../pages/History";
import MyBooks from "../pages/MyBooks";
import BookDetails from "../pages/BookDetails";
import UserProfile from "../pages/UserProfile";
import Swipe from "../pages/Swipe";
import SwipeHistory from "../pages/SwipeHistory";
// Páginas de pago
import PaymentSuccess from "../pages/PaymentSuccess";
import PaymentFailure from "../pages/PaymentFailure";
import PaymentPending from "../pages/PaymentPending";

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* Routes without MainLayout (auth pages) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Routes with MainLayout (public pages) */}
        <Route
          path="/"
          element={
            <MainLayout>
              <Home />
            </MainLayout>
          }
        />

        {/* Dashboard routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </PrivateRoute>
          }
        />

        {/* Explore books route */}
        <Route
          path="/dashboard/explore"
          element={
            <PrivateRoute>
              <DashboardLayout>
                <Explore />
              </DashboardLayout>
            </PrivateRoute>
          }
        />

        {/* Swipe books route */}
        <Route
          path="/dashboard/swipe"
          element={
            <PrivateRoute>
              <DashboardLayout>
                <Swipe />
              </DashboardLayout>
            </PrivateRoute>
          }
        />

        {/* Swipe history route */}
        <Route
          path="/dashboard/swipe/history"
          element={
            <PrivateRoute>
              <DashboardLayout>
                <SwipeHistory />
              </DashboardLayout>
            </PrivateRoute>
          }
        />

        {/* Publish book route */}
        <Route 
          path="/dashboard/publish" 
          element={
            <PrivateRoute>
              <PublishBook />
            </PrivateRoute>
          } 
        />

        {/* Library routes */}
        <Route
          path="/dashboard/library"
          element={
            <PrivateRoute>
              <DashboardLayout>
                <MyLibrary />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/my-books"
          element={
            <PrivateRoute>
              <DashboardLayout>
                <MyBooks />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/library/add"
          element={
            <PrivateRoute>
              <DashboardLayout>
                <AddToLibrary />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/library/edit/:id"
          element={
            <PrivateRoute>
              <DashboardLayout>
                <EditLibraryBook />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/library/insights"
          element={
            <PrivateRoute>
              <DashboardLayout>
                <LibraryInsights />
              </DashboardLayout>
            </PrivateRoute>
          }
        />

        {/* Matches routes */}
        <Route
          path="/dashboard/matches"
          element={
            <PrivateRoute>
              <DashboardLayout>
                <Matches />
              </DashboardLayout>
            </PrivateRoute>
          }
        />

        {/* Messages routes */}
        <Route
          path="/dashboard/messages"
          element={
            <PrivateRoute>
              <DashboardLayout>
                <Messages />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/messages/:matchId"
          element={
            <PrivateRoute>
              <DashboardLayout>
                <Messages />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/messages/new"
          element={
            <PrivateRoute>
              <DashboardLayout>
                <Messages />
              </DashboardLayout>
            </PrivateRoute>
          }
        />

        {/* Ratings routes */}
        <Route
          path="/dashboard/ratings"
          element={
            <PrivateRoute>
              <DashboardLayout>
                <Ratings />
              </DashboardLayout>
            </PrivateRoute>
          }
        />

        {/* Favorites routes */}
        <Route
          path="/dashboard/favorites"
          element={
            <PrivateRoute>
              <DashboardLayout>
                <Favorites />
              </DashboardLayout>
            </PrivateRoute>
          }
        />

        {/* Wishlist routes */}
        <Route
          path="/dashboard/wishlist"
          element={
            <PrivateRoute>
              <DashboardLayout>
                <Wishlist />
              </DashboardLayout>
            </PrivateRoute>
          }
        />

        {/* Drafts routes */}
        <Route
          path="/dashboard/drafts"
          element={
            <PrivateRoute>
              <DashboardLayout>
                <Drafts />
              </DashboardLayout>
            </PrivateRoute>
          }
        />

        {/* History routes */}
        <Route
          path="/dashboard/history"
          element={
            <PrivateRoute>
              <DashboardLayout>
                <History />
              </DashboardLayout>
            </PrivateRoute>
          }
        />

        {/* Book details route */}
        <Route
          path="/book/:bookId"
          element={
            <PrivateRoute>
              <BookDetails />
            </PrivateRoute>
          }
        />

        {/* User profile route */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <UserProfile />
            </PrivateRoute>
          }
        />

        {/* Public profile route */}
        <Route
          path="/profile/:userId"
          element={
            <PrivateRoute>
              <UserProfile />
            </PrivateRoute>
          }
        />

        {/* Rutas de pagos - Públicas pero requieren parámetros */}
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failure" element={<PaymentFailure />} />
        <Route path="/payment/pending" element={<PaymentPending />} />
      </Routes>
    </Router>
  );
}
