import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Laptop, 
  Download, 
  Key, 
  Shield, 
  Mail, 
  UserPlus, 
  Cloud, 
  Database, 
  HardDrive, 
  Grid, 
  Clock, 
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  X
} from 'lucide-react';
import { serviceRequestService, ServiceCatalogItem } from '../services/serviceRequestService';

export const ServiceCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<ServiceCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceCatalogItem | null>(null);
  
  // Form modal state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    serviceRequestService.getCatalog().then(data => {
      setCatalog(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Laptop': return <Laptop className="w-6 h-6 text-indigo-400" />;
      case 'Download': return <Download className="w-6 h-6 text-emerald-400" />;
      case 'Key': return <Key className="w-6 h-6 text-amber-400" />;
      case 'Shield': return <Shield className="w-6 h-6 text-blue-400" />;
      case 'Mail': return <Mail className="w-6 h-6 text-purple-400" />;
      case 'UserPlus': return <UserPlus className="w-6 h-6 text-rose-400" />;
      case 'Cloud': return <Cloud className="w-6 h-6 text-cyan-400" />;
      case 'Database': return <Database className="w-6 h-6 text-orange-400" />;
      case 'HardDrive': return <HardDrive className="w-6 h-6 text-teal-400" />;
      default: return <Grid className="w-6 h-6 text-slate-400" />;
    }
  };

  const handleOpenModal = (service: ServiceCatalogItem) => {
    setSelectedService(service);
    setTitle(`Request for ${service.name}`);
    setDescription(`Requesting ${service.name} service. Business justification provided.`);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    setIsSubmitting(true);
    try {
      const req = await serviceRequestService.createRequest({
        service_id: selectedService.id,
        title,
        description,
        additional_info: additionalInfo
      });
      alert(`Service Request ${req.request_number} submitted successfully!`);
      setSelectedService(null);
      navigate('/service-requests');
    } catch {
      alert("Failed to submit service request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <ShoppingBag className="w-4 h-4" /> Enterprise Service Catalog
          </div>
          <h1 className="text-2xl font-bold text-slate-100">IT Service Request Portal</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse pre-approved IT services, access requests, hardware provisions, and software licenses.
          </p>
        </div>
        <button
          onClick={() => navigate('/service-requests')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <span>View Active Requests</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-3">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs">Loading IT Service Catalog items...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {catalog.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-all group shadow-lg"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {getIcon(item.icon)}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-950 text-slate-400 border border-slate-800">
                    {item.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">{item.name}</h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{item.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" /> Fulfillment SLA
                    </span>
                    <span className="font-mono font-semibold text-slate-200">{item.fulfillment_time_hours} hrs</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Approval Policy
                    </span>
                    <span className={`font-semibold text-[10px] px-2 py-0.5 rounded ${
                      item.approval_required ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {item.approval_required ? 'Manager Approval' : 'Auto Approved'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-4">
                <button
                  onClick={() => handleOpenModal(item)}
                  className="w-full py-2.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Request Service</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Form Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-slate-100">Submit Request: {selectedService.name}</h3>
              </div>
              <button onClick={() => setSelectedService(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Request Summary *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Business Justification *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Additional Information / Specifications</label>
                <input
                  type="text"
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="e.g. Preferred model, RAM, region, or database schema name..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Assigned Queue: <strong>{selectedService.assigned_team_name}</strong></span>
                <span>Fulfillment Target: <strong>{selectedService.fulfillment_time_hours} Hours</strong></span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-indigo-600/30"
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm & Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
