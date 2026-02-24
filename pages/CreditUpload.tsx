import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Upload, FileText, X } from 'lucide-react';

const CreditUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const simulateUpload = () => {
    setUploading(true);
    // In real app, call POST /api/financial/upload
    setTimeout(() => {
      setParsedData({
        issuer_name: 'HDFC Bank',
        masked_card_number: 'XXXX-XXXX-XXXX-4321',
        credit_limit: 100000,
        total_outstanding: 25000,
        minimum_due: 1250,
        due_date: '2026-03-15'
      });
      setUploading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen p-6 pb-24 flex items-center justify-center transition-colors duration-300" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
      <div className="max-w-md w-full space-y-8">
        <header className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand/30"
          >
            <ShieldCheck className="text-brand w-8 h-8" />
          </motion.div>
          <h1 className="text-2xl font-black tracking-tighter uppercase">Vault Upload</h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-2">End-to-End Encrypted Analysis</p>
        </header>

        <AnimatePresence mode="wait">
          {!parsedData ? (
            <motion.div
              key="uploader"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass p-10 rounded-[2.5rem] text-center relative group min-h-[300px] flex flex-col items-center justify-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                accept=".pdf"
                onChange={handleFileChange}
              />
              <Upload className="mx-auto w-12 h-12 text-brand mb-4 opacity-50 group-hover:opacity-100 transition-all group-hover:scale-110" />
              <p className="font-bold text-sm">
                {file ? file.name : 'Drop Statement PDF'}
              </p>
              <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mt-2">{file ? `${(file.size / 1024).toFixed(0)} KB` : 'Max 10MB • Secure Channel'}</p>

              {file && (
                <button 
                  onClick={(e) => { e.stopPropagation(); simulateUpload(); }}
                  disabled={uploading}
                  className="mt-8 px-8 mint-gradient text-black font-black text-[10px] uppercase tracking-widest py-3 rounded-full transition-all shadow-lg hover:shadow-brand/20 relative z-20"
                >
                  {uploading ? 'Parsing Engine Active...' : 'Decrypt Statement'}
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="summary"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass p-8 rounded-[2.5rem] shadow-2xl relative"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 text-brand text-[8px] font-black uppercase tracking-widest mb-1">
                    <ShieldCheck size={12} className="animate-pulse-glow" />
                    Verified Snapshot
                  </div>
                  <h3 className="text-xl font-black tracking-tight">{parsedData.issuer_name}</h3>
                </div>
                <button onClick={() => setParsedData(null)} className="text-gray-500 hover:text-red-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 glass rounded-2xl border-none bg-brand/5">
                    <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Outstanding</p>
                    <p className="text-lg font-black mt-1">₹{parsedData.total_outstanding.toLocaleString()}</p>
                  </div>
                  <div className="p-4 glass rounded-2xl border-none bg-brand/5">
                    <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Due Date</p>
                    <p className="text-lg font-black mt-1">{parsedData.due_date}</p>
                  </div>
                </div>

                <div className="p-5 glass rounded-2xl border-none bg-brand/5">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest leading-none">Limit Utilization</p>
                    <p className="text-[10px] font-black text-brand">25%</p>
                  </div>
                  <div className="w-full bg-gray-500/10 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '25%' }}
                      className="bg-brand h-full rounded-full"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button className="flex-1 mint-gradient text-black font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-brand/10">
                  Secure to Vault
                </button>
                <button onClick={() => setParsedData(null)} className="px-6 glass border-none text-gray-500 font-bold text-[10px] rounded-2xl hover:text-brand transition-colors uppercase">
                  Discard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="glass p-4 rounded-2xl border-none bg-gray-500/5">
          <div className="flex gap-3 items-start">
            <FileText className="text-gray-500 w-5 h-5 mt-1 shrink-0 opacity-50" />
            <p className="text-[9px] text-gray-400 leading-relaxed font-bold uppercase tracking-wider opacity-60">
              FlowMint never stores full account numbers. Data is encrypted and used only for local command center visualization.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CreditUpload;
