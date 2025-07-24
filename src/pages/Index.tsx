
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to splash screen immediately
    navigate('/');
  }, [navigate]);

  // This component should not render as it redirects immediately
  return null;
};

export default Index;
