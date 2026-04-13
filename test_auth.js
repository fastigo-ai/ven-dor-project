
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/register/verify',
  '/register/password',
  '/register/company',
  '/forgot-password',
  '/pending',
  '/admin/login',
  '/admin',
];

const testPath = (pathname, currentVendor = null) => {
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    if (pathname === '/admin/login') return 'STAY (Allow Admin Login)';
    return 'STAY (Handled by AdminPanel)';
  }

  if (!currentVendor && !isPublicRoute) {
    return 'REDIRECT to /login';
  } else if (currentVendor && (pathname === '/login' || pathname === '/register' || pathname === '/')) {
    return 'REDIRECT to /dashboard';
  }
  
  return 'STAY';
};

console.log('/admin/login:', testPath('/admin/login'));
console.log('/login:', testPath('/login'));
console.log('/dashboard (not logged in):', testPath('/dashboard'));
console.log('/dashboard (logged in):', testPath('/dashboard', {id: '1'}));
console.log('/admin (not logged in):', testPath('/admin'));
console.log('/:', testPath('/', {id: '1'}));
