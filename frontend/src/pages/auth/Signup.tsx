import { useState, FormEvent, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { useAuth } from '../../hooks/useAuth';
import { Eye, EyeOff, Zap } from 'lucide-react';

interface Country {
  name: { common: string };
  cca2: string;
}

export function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [countries, setCountries] = useState<Country[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);

  const { signup, isSigningUp, signupError } = useAuth();

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name,cca2')
      .then((r) => r.json())
      .then((data: Country[]) => {
        const sorted = data.sort((a, b) => a.name.common.localeCompare(b.name.common));
        setCountries(sorted);
      })
      .catch(() => {
        // Use a small fallback list if API fails
        setCountries([
          { name: { common: 'United States' }, cca2: 'US' },
          { name: { common: 'United Kingdom' }, cca2: 'GB' },
          { name: { common: 'India' }, cca2: 'IN' },
          { name: { common: 'Canada' }, cca2: 'CA' },
          { name: { common: 'Australia' }, cca2: 'AU' },
          { name: { common: 'Germany' }, cca2: 'DE' },
          { name: { common: 'France' }, cca2: 'FR' },
          { name: { common: 'Japan' }, cca2: 'JP' },
          { name: { common: 'China' }, cca2: 'CN' },
          { name: { common: 'Brazil' }, cca2: 'BR' },
        ]);
      })
      .finally(() => setLoadingCountries(false));
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password || !companyName || !country) {
      setFormError('Please fill in all required fields');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }
    setFormError('');
    signup({ email, password, company_name: companyName, country });
  };

  const errorMessage = formError || (signupError as { response?: { data?: { error?: string } } })?.response?.data?.error || '';

  const countryOptions = countries.map((c) => ({
    value: c.name.common,
    label: c.name.common,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-surface to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-text-primary">CogniClaim</h1>
              <p className="text-xs text-gray-400">AI Expense Management</p>
            </div>
          </div>
          <p className="text-gray-500">Create your company account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-danger text-sm rounded-lg px-4 py-3">
                {errorMessage}
              </div>
            )}

            <Input
              label="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Corp"
            />

            <Select
              label="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              options={countryOptions}
              placeholder={loadingCountries ? 'Loading countries...' : 'Select your country'}
              disabled={loadingCountries}
              hint="Your company's base currency will be auto-detected"
            />

            <Input
              label="Admin Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@company.com"
              autoComplete="email"
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-text-primary">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pr-10 text-sm text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Input
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
            />

            <Button type="submit" className="w-full mt-2" loading={isSigningUp} size="lg">
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          You'll be set up as the Admin for your company
        </p>
      </div>
    </div>
  );
}
