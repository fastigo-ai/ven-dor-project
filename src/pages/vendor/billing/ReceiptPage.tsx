
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { apiFetch } from '@/services/apiClient';

const ReceiptPage = () => {
  const { transactionId } = useParams();
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const response = await apiFetch(`/vendor/billing/receipt/${transactionId}`, {
          headers: {
            'Accept': 'text/html'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch receipt');
        }

        const html = await response.text();
        setHtmlContent(html);
      } catch (err) {
        console.error('Error fetching receipt:', err);
        setError('Could not load receipt. Please ensure the transaction was successful.');
      } finally {
        setLoading(false);
      }
    };

    if (transactionId) {
      fetchReceipt();
    }
  }, [transactionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">Generating your premium receipt...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar for the receipt page */}
      <div className="no-print bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="hover:bg-slate-100">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div className="h-6 w-px bg-slate-200" />
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Payment Receipt</h1>
        </div>
        <Button onClick={() => window.print()} className="bg-primary hover:bg-primary/90 text-white font-bold">
          <Printer className="h-4 w-4 mr-2" /> Print Receipt
        </Button>
      </div>

      {/* Render the backend HTML */}
      <div className="p-4 md:p-8">
        <div 
          className="receipt-container"
          dangerouslySetInnerHTML={{ __html: htmlContent }} 
        />
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          .receipt-container { padding: 0 !important; }
        }
        /* Override backend styles to fit in the container */
        .receipt-container .receipt-card {
          margin: 0 auto !important;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1) !important;
        }
        @media print {
          .receipt-container .receipt-card {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ReceiptPage;
