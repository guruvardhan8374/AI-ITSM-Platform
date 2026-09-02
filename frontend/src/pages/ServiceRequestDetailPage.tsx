import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShoppingBag, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  AlertCircle,
  Activity
} from 'lucide-react';
import { serviceRequestService, ServiceRequest, ServiceRequestHistoryItem } from '../services/serviceRequestService';

export const ServiceRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [history, setHistory] = useState<ServiceRequestHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Approval modal state
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await serviceRequestService.getRequest(id);
      setRequest(data);

      const histData = await serviceRequestService.getHistory(data.id);
      setHistory(histData);
    } catch (err) {
      console.error("Failed loading request details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const handleApprovalSubmit = async () => {
    if (!request) return;
    setIsSubmitting(true);
    try {
      if (approvalAction === 'approve') {
        await serviceRequestService.approveRequest(request.id, comments);
      } else {
        await serviceRequestService.rejectRequest(request.id, comments);
      }
      setShowApprovalModal(false);
      loadDetails();
    } catch {
      alert("Failed to submit decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!request) return;
    try {
      await serviceRequestService.updateStatus(request.id, newStatus);
      loadDetails();
    } catch {
      alert("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading Service Request Console...</span>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-4">
        <ShoppingBag className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-200">Service Request Not Found</h2>
        <button onClick={() => navigate('/service-requests')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold">
          Return to Service Requests
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div className="space-y-1">
          <button
            onClick={() => navigate('/service-requests')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Requests List
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xl font-mono font-bold text-indigo-400">{request.request_number}</span>
            <h1 className="text-xl font-bold text-slate-100">{request.title}</h1>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2">
          {request.status === 'APPROVED' && (
            <button
              onClick={() => handleUpdateStatus('FULFILLMENT')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-purple-600/30 transition-all flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5" /> Start Fulfillment
            </button>
          )}

          {request.status === 'FULFILLMENT' && (
            <button
              onClick={() => handleUpdateStatus('COMPLETED')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-5">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Request Information</h2>
            
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {request.description}
            </div>

            {request.additional_info && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 text-xs">
                <span className="font-semibold text-indigo-400">Additional Specifications:</span>
                <p className="text-slate-300 font-mono">{request.additional_info}</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs pt-2">
              <div>
                <span className="text-slate-500 font-medium">Service Name:</span>
                <p className="font-semibold text-slate-200 mt-0.5">{request.service?.name || 'Custom Service'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Requester:</span>
                <p className="font-semibold text-slate-200 mt-0.5">{request.requester.full_name}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Fulfillment SLA:</span>
                <p className="font-semibold text-indigo-400 mt-0.5">{request.service?.fulfillment_time_hours || 4} Hours</p>
              </div>
            </div>
          </div>

          {/* Audit History Timeline */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Audit Timeline History</h2>
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{item.field_changed}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{new Date(item.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    By <strong className="text-slate-300">{item.changed_by.full_name}</strong>: {item.new_value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" /> Manager Approval Panel
              </h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                request.approval_status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                request.approval_status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {request.approval_status}
              </span>
            </div>

            {request.approval_status === 'PENDING' ? (
              <div className="bg-amber-950/30 border border-amber-500/30 p-4 rounded-xl space-y-3 text-xs">
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                  <AlertCircle className="w-4 h-4" /> Manager Approval Pending
                </div>
                <p className="text-slate-300 text-[11px]">This service request requires manager authorization before fulfillment begins.</p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => { setApprovalAction('approve'); setShowApprovalModal(true); }}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => { setApprovalAction('reject'); setShowApprovalModal(true); }}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Decision:</span>
                  <strong className="text-slate-100">{request.approval_status}</strong>
                </div>
                {request.approver && (
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Approver:</span>
                    <strong className="text-slate-100">{request.approver.full_name}</strong>
                  </div>
                )}
                {request.approval_decision_at && (
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Timestamp:</span>
                    <strong className="font-mono text-slate-300">{new Date(request.approval_decision_at).toLocaleDateString()}</strong>
                  </div>
                )}
                {request.approval_comments && (
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 font-mono">
                    "{request.approval_comments}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-6 rounded-2xl space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 capitalize">
              {approvalAction} Service Request {request.request_number}
            </h3>
            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-300">Approval Comments / Notes</label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Enter justification or approval notes..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 text-xs">
              <button onClick={() => setShowApprovalModal(false)} className="px-4 py-2 text-slate-400">Cancel</button>
              <button
                onClick={handleApprovalSubmit}
                disabled={isSubmitting}
                className={`px-5 py-2 text-white font-semibold rounded-lg ${
                  approvalAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {isSubmitting ? 'Submitting...' : `Confirm ${approvalAction}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
