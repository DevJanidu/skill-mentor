import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Github, Globe, Instagram, Linkedin, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative bg-zinc-950 text-zinc-400 py-20 overflow-hidden">
      {/* BACKGROUND MAP ELEMENT */}
      <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none lg:w-1/2">
        <svg
          viewBox="0 0 1000 500"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover"
        >
          <path
            fill="currentColor"
            d="M250 150 a2 2 0 1 1 0.001 0 z M300 180 a2 2 0 1 1 0.001 0 z M350 140 a2 2 0 1 1 0.001 0 z M400 200 a2 2 0 1 1 0.001 0 z M450 120 a2 2 0 1 1 0.001 0 z M500 250 a2 2 0 1 1 0.001 0 z M550 180 a2 2 0 1 1 0.001 0 z M600 220 a2 2 0 1 1 0.001 0 z M650 150 a2 2 0 1 1 0.001 0 z M700 190 a2 2 0 1 1 0.001 0 z M750 130 a2 2 0 1 1 0.001 0 z M800 240 a2 2 0 1 1 0.001 0 z M280 220 a2 2 0 1 1 0.001 0 z M320 260 a2 2 0 1 1 0.001 0 z M380 230 a2 2 0 1 1 0.001 0 z M420 280 a2 2 0 1 1 0.001 0 z M480 210 a2 2 0 1 1 0.001 0 z M520 300 a2 2 0 1 1 0.001 0 z M580 240 a2 2 0 1 1 0.001 0 z M620 320 a2 2 0 1 1 0.001 0 z M680 270 a2 2 0 1 1 0.001 0 z M720 350 a2 2 0 1 1 0.001 0 z M780 290 a2 2 0 1 1 0.001 0 z"
          />
          {/* Note: In a real project, use a full SVG Map file or a high-res dotted map image */}
          <circle cx="200" cy="200" r="1" fill="white" />
          <circle cx="400" cy="150" r="1" fill="white" />
          <circle cx="600" cy="300" r="1" fill="white" />
          <circle cx="800" cy="200" r="1" fill="white" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Column 1: Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-white">
              <div className="h-8 w-8 bg-white rounded flex items-center justify-center text-black font-bold text-xl">
                S
              </div>
              <span className="text-xl font-bold tracking-tight">Skill Mentor</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              Connecting the next generation of talent with industry experts worldwide. Learn, grow,
              and succeed together.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Github size={20} />
              </a>
            </div>
          </div>

          {/* Column 2: Platform */}
          <div className="space-y-6">
            <h4 className="text-white font-bold uppercase text-xs tracking-widest">Platform</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Find a Mentor
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Browse Subjects
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  How it Works
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div className="space-y-6">
            <h4 className="text-white font-bold uppercase text-xs tracking-widest">Company</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="space-y-6">
            <h4 className="text-white font-bold uppercase text-xs tracking-widest">Stay Updated</h4>
            <p className="text-sm">Get the latest mentorship tips and subject updates.</p>
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Input
                  placeholder="Email address"
                  className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-zinc-700 h-11 pr-12"
                />
                <Button
                  size="icon"
                  className="absolute right-1 top-1 h-9 w-9 bg-white text-black hover:bg-zinc-200"
                >
                  <ArrowRight size={18} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-xs">
            <Globe size={14} />
            <span>Based in Colombo, Sri Lanka • Available Globally</span>
          </div>
          <p className="text-xs">© {new Date().getFullYear()} Skill Mentor. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
