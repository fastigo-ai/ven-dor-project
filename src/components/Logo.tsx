import { Link } from 'react-router-dom';

const Logo = () => {
  return (
    <Link to="/" className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
        <span className="text-primary-foreground font-display font-bold text-xl">D</span>
      </div>
      <span className="font-display font-semibold text-xl text-foreground">
        Door<span className="text-primary">2</span>Fy
      </span>
    </Link>
  );
};

export default Logo;
