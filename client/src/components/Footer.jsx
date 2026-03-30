import { Link } from 'react-router-dom';
import { HeartIcon } from '@heroicons/react/24/outline';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-primary-400 mb-4">HomeStay</h3>
            <p className="text-gray-300 mb-4">
              Find your perfect home away from home. Book unique stays and experiences 
              around the world with our premium homestay marketplace.
            </p>
            <div className="flex items-center text-gray-400">
              <span>Made with</span>
              <HeartIcon className="h-5 w-5 text-red-500 mx-2" />
              <span>for travelers everywhere</span>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Explore</h4>
            <ul className="space-y-2 text-gray-300">
              <li><Link to="/search" className="hover:text-white transition-colors">Find Stays</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Destinations</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Experiences</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Travel Guides</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Safety</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cancellation</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2026 HomeStay. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;