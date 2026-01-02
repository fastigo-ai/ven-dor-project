import { Link } from 'react-router-dom';
import door2fyLogo from '@/assets/door2fy-logo.png';

const Logo = () => {
  return (
    <Link to="/" className="flex items-center">
      <img 
        src={door2fyLogo} 
        alt="Door2Fy - Repair They Gadgets At Home" 
        className="h-10 sm:h-12 w-auto object-contain"
      />
    </Link>
  );
};

export default Logo;
