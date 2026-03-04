import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import { GraduationCapIcon, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { isAdmin } from "@/lib/roles";

function Navbar() {
  const { user, isSignedIn } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const admin =
    isSignedIn && isAdmin(user?.publicMetadata as Record<string, unknown>);

  return (
    <div className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <GraduationCapIcon className="h-6 w-6 text-zinc-900" />
          <span className="text-xl font-bold text-zinc-900">
            Skill<span className="text-zinc-500">Mentor</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-700">
          <Link to="/" className="hover:text-zinc-900 transition">
            Home
          </Link>
          <Link to="/mentors" className="hover:text-zinc-900 transition">
            Mentors
          </Link>
          <Link to="/subjects" className="hover:text-zinc-900 transition">
            Subjects
          </Link>
          {isSignedIn && (
            <Link to="/dashboard" className="hover:text-zinc-900 transition">
              Dashboard
            </Link>
          )}
          {admin && (
            <Link to="/admin" className="hover:text-zinc-900 transition">
              Admin Panel
            </Link>
          )}
        </nav>

        {/* Desktop Auth Buttons / User Avatar */}
        <div className="hidden md:flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline" className="px-5">
                Login
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button className="px-5">Register</Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-700">
                Hi, {user?.firstName}
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </div>

        {/* Mobile Menu Button and Auth */}
        <div className="flex md:hidden items-center gap-3">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <button
            onClick={toggleMobileMenu}
            className="text-zinc-900 hover:text-zinc-600 transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <nav className="px-4 py-6 space-y-4">
            <Link
              to="/"
              onClick={toggleMobileMenu}
              className="block w-full text-left py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 transition"
            >
              Home
            </Link>
            <Link
              to="/mentors"
              onClick={toggleMobileMenu}
              className="block w-full text-left py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 transition"
            >
              Mentors
            </Link>
            <Link
              to="/subjects"
              onClick={toggleMobileMenu}
              className="block w-full text-left py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 transition"
            >
              Subjects
            </Link>
            {isSignedIn && (
              <Link
                to="/dashboard"
                onClick={toggleMobileMenu}
                className="block w-full text-left py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 transition"
              >
                Dashboard
              </Link>
            )}
            {admin && (
              <Link
                to="/admin"
                onClick={toggleMobileMenu}
                className="block w-full text-left py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 transition"
              >
                Admin Panel
              </Link>
            )}

            {/* Mobile Auth Buttons */}
            <SignedOut>
              <div className="pt-4 space-y-3 border-t">
                <SignInButton mode="modal">
                  <Button variant="outline" className="w-full">
                    Login
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button className="w-full">Register</Button>
                </SignUpButton>
              </div>
            </SignedOut>
            <SignedIn>
              <div className="pt-4 border-t">
                <p className="text-sm text-zinc-700">
                  Signed in as{" "}
                  <span className="font-medium">{user?.firstName}</span>
                </p>
              </div>
            </SignedIn>
          </nav>
        </div>
      )}
    </div>
  );
}

export default Navbar;
