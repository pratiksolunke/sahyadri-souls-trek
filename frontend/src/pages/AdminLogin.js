import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminLogin = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/admin/login`, credentials);
      localStorage.setItem('admin_token', response.data.token);
      toast.success('Login successful!');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white border border-border rounded-md p-8">
          <div className="text-center mb-8">
            <img 
              src="https://customer-assets.emergentagent.com/job_67e65c9a-584b-48ad-8d49-6a2225203899/artifacts/nvdxnh6u_Picsart_25-09-13_14-14-09-163.png" 
              alt="Sahyadri Souls Trek" 
              className="h-16 w-16 object-contain mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold mb-2">Admin Login</h1>
            <p className="text-text-muted">Access the dashboard</p>
          </div>

          <form onSubmit={handleSubmit} data-testid="admin-login-form">
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={credentials.username}
                  onChange={handleInputChange}
                  required
                  data-testid="input-username"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={credentials.password}
                  onChange={handleInputChange}
                  required
                  data-testid="input-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover text-white py-6 rounded-md mt-6"
                disabled={loading}
                data-testid="login-button"
              >
                {loading ? 'Logging in...' : (
                  <>
                    <LogIn className="mr-2" size={20} />
                    Login
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-text-muted">
            <p>Demo credentials: admin / admin123</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
