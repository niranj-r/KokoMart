import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function SignupRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect instantly to the unified Phone OTP login screen
    router.replace('/login');
  }, []);

  return null;
}
