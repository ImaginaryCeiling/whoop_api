'use client';

export default function AuthButton() {
  const handleAuth = async () => {
    try {
      const response = await fetch('/api/auth/url');
      const text = await response.text();
      let data;
      
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse response:', text);
        throw new Error('Invalid response from server');
      }
      
      if (!response.ok || data.error) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }
      
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Error getting auth URL:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Whoop Dashboard
          </h1>
          <p className="text-gray-600">
            Connect your Whoop account to view your fitness stats
          </p>
        </div>
        
        <button
          onClick={handleAuth}
          className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Connect with Whoop
        </button>
        
        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>
            You&apos;ll be redirected to Whoop to authorize access to your data.
            Make sure to set up your environment variables first.
          </p>
        </div>
      </div>
    </div>
  );
}