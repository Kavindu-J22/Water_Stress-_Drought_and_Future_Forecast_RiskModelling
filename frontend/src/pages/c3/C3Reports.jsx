import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  FileSpreadsheet, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { HorizonTabs } from '../../components/c3/HorizonTabs';
import c3Api from '../../services/c3Api';

export function C3Reports() {
  const [horizonMonths, setHorizonMonths] = useState(1);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(null); // 'drought_risk_pdf', etc.
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    c3Api.getReports()
      .then(res => {
        setReportData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load reports metadata:', err);
        setLoading(false);
      });
  }, []);

  const handleDownload = async (reportType, format) => {
    const key = `${reportType}_${format}`;
    setGeneratingReport(key);
    try {
      await c3Api.generateReportDownload(reportType, horizonMonths, format);
      setToastMessage(`Successfully downloaded ${reportType.replace('_', ' ')} (${format.toUpperCase()})`);
    } catch (err) {
      console.warn('Blob download fell back to direct URL stream:', err);
      try {
        const directUrl = c3Api.getReportDownloadUrl(reportType, horizonMonths, format);
        const a = document.createElement('a');
        a.href = directUrl;
        a.setAttribute('download', `${reportType}_h${horizonMonths}.${format}`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setToastMessage(`Downloaded ${reportType.replace('_', ' ')} (${format.toUpperCase()})`);
      } catch (fallbackErr) {
        setToastMessage('Report generation error: ' + err.message);
      }
    } finally {
      setGeneratingReport(null);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const reports = [
    {
      id: 'drought_risk',
      title: 'Drought Risk Forecast Report',
      description: 'Comprehensive forecasted SPI-3, risk categories, and 90% conformal intervals across all 32 zones.',
      pdfSupported: true,
      csvSupported: true,
      tag: 'Primary Forecast'
    },
    {
      id: 'environmental_indicators',
      title: 'Environmental Indicators Report',
      description: 'Tabulated monthly precipitation, temperature, solar radiation, humidity, and soil moisture proxies.',
      pdfSupported: true,
      csvSupported: true,
      tag: 'Historical Baseline'
    },
    {
      id: 'forecast_accuracy',
      title: 'Model Forecast Accuracy Report',
      description: 'Held-out test set evaluation matrix (MAE, RMSE, Recall, Macro F1, Conformal 90% Coverage) and ablation.',
      pdfSupported: true,
      csvSupported: true,
      tag: 'ML Validation'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-neutral-900 text-white px-4 py-3 rounded-md shadow-xl text-xs flex items-center space-x-2 border border-neutral-700 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white p-5 rounded-md border border-neutral-200 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary-500" />
            <span>Reports & Analytical Exports</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Export validated research reports in PDF format and raw tabular CSV data.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            Target Forecast Horizon
          </label>
          <HorizonTabs activeHorizon={horizonMonths} onChange={setHorizonMonths} />
        </div>
      </div>

      {/* Available Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reports.map(rep => (
          <Card
            key={rep.id}
            title={rep.title}
            subtitle={rep.tag}
            className="flex flex-col justify-between"
          >
            <p className="text-xs text-neutral-600 leading-relaxed mb-6 min-h-[48px]">
              {rep.description}
            </p>

            <div className="space-y-2 pt-4 border-t border-neutral-100">
              <Button
                variant="primary"
                size="sm"
                fullWidth={true}
                icon={Download}
                loading={generatingReport === `${rep.id}_pdf`}
                onClick={() => handleDownload(rep.id, 'pdf')}
              >
                Download PDF Report
              </Button>

              <Button
                variant="outline"
                size="sm"
                fullWidth={true}
                icon={FileSpreadsheet}
                loading={generatingReport === `${rep.id}_csv`}
                onClick={() => handleDownload(rep.id, 'csv')}
              >
                Download CSV Data
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Scheduled Reports & Automated Subscriptions */}
      <Card title="Scheduled Automated Reports" subtitle="Background report generation daemon">
        <div className="p-4 bg-neutral-50 rounded-md border border-neutral-200 flex items-start space-x-3 text-xs text-neutral-600">
          <AlertCircle className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-neutral-800">Standalone Research Prototype Mode</span>
            <p>
              Automated recurring report scheduling via cron/worker queues is disabled in standalone demo mode.
              All on-demand PDF and CSV generation buttons above execute live against the pipeline.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default C3Reports;
