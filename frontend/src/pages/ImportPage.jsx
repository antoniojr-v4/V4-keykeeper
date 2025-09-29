import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { apiClient } from '@/App';
import { Upload, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ImportPage = () => {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const downloadTemplate = () => {
    const template = [
      ['vault_path', 'type', 'title', 'login', 'password', 'login_url', 'environment', 'criticality', 'client', 'squad'],
      ['Client X > Product Y > Squad Z', 'web_credential', 'Google Ads Account', 'user@example.com', 'SecurePass123', 'https://ads.google.com', 'prod', 'high', 'Client X', 'Squad Z'],
      ['Client X > Product Y', 'api_key', 'Facebook API', '', 'fb_api_key_12345', 'https://developers.facebook.com', 'prod', 'high', 'Client X', ''],
    ];

    const csvContent = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'v4_password_import_template.csv';
    a.click();
    toast.success('Template downloaded');
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',');
      
      const rows = lines.slice(1).map(line => {
        const values = line.split(',');
        const row = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim() || '';
        });
        return row;
      });

      const response = await apiClient.post('/import/sheets', rows);
      setImportResult(response.data);
      toast.success(`Imported ${response.data.imported_count} items successfully`);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import file');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <Sidebar />
      
      <div className="flex-1">
        <Header title="Import Data" description="Bulk import passwords from Google Sheets or CSV" />
        
        <div className="p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-[#e5e7eb]">
              <div className="text-center mb-6">
                <Upload className="w-16 h-16 text-[#ff2c2c] mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-[#1f2937] mb-2">Import Your Passwords</h2>
                <p className="text-[#6b7280]">Upload a CSV file with your passwords to bulk import</p>
              </div>

              <div className="space-y-4">
                <div className="bg-[#fafafa] rounded-lg p-4 border border-[#e5e7eb]">
                  <h3 className="font-semibold text-[#1f2937] mb-2">Instructions:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-[#6b7280]">
                    <li>Download the CSV template below</li>
                    <li>Fill in your passwords following the format</li>
                    <li>Upload the completed CSV file</li>
                    <li>Review the import results</li>
                  </ol>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={downloadTemplate}
                    data-testid="download-template-btn"
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>

                  <label className="flex-1">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      data-testid="upload-csv-input"
                    />
                    <Button
                      as="div"
                      disabled={importing}
                      className="w-full bg-[#10b981] hover:bg-[#059669] text-white cursor-pointer"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {importing ? 'Importing...' : 'Upload CSV'}
                    </Button>
                  </label>
                </div>
              </div>

              {importResult && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-green-900 mb-1">Import Completed!</p>
                      <p className="text-sm text-green-700">
                        Successfully imported {importResult.imported_count} items
                      </p>
                      {importResult.errors_count > 0 && (
                        <p className="text-sm text-red-700 mt-2">
                          {importResult.errors_count} errors occurred during import
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900 mb-1">CSV Format</p>
                    <p className="text-sm text-blue-700">
                      Required columns: vault_path, type, title, login, password, login_url, environment, criticality, client, squad
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportPage;
