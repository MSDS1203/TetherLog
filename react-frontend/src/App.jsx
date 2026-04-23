import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Search from "./pages/Search";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";
import Navbar from "./components/Navbar";
import BookDetails from "./pages/BookDetails";
import Followers from "./pages/following";
import MyBooks from "./pages/MyBooks";
import CreateBook from "./components/CreateBook"; 
import EditBook from "./pages/EditBook";
import ProfileEdit from "./pages/ProfileEdit"; 
import UpdateProgress from "./pages/UpdateProgress";
import "./App.css";


function AppLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/search" element={<Search />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/profile/:id/edit" element={<ProfileEdit />} />
        <Route path="/profile/:id/followers" element={<Followers />} />
        <Route path="/profile/:id/following" element={<Followers />} />
        <Route path="/books/:id" element={<BookDetails />} />
        <Route path="/my-books" element={<MyBooks />} />
        <Route path="/books/new" element={<CreateBook />} />
        <Route path="/books/:id" element={<BookDetails />} />
        <Route path="/books/edit/:id" element={<EditBook />} /> 
        <Route path="/books/external/:key" element={<BookDetails />} />
        <Route path="/update-progress/:bookId" element={<UpdateProgress />} />
      </Route>
    </Routes>
  );
}