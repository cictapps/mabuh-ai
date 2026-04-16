export const MaskOverlay = ({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="absolute inset-0 bg-twilight-dark/40 backdrop-blur-md z-20 flex items-center justify-center p-6">
      <div className="text-center p-8 bg-white dark:bg-twilight-dark rounded-[2.5rem] shadow-2xl border-2 border-accent/50 animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-rounded text-5xl text-accent">mask_off</span>
        </div>
        <h3 className="text-xl font-bold mb-2">Mask-off Mode</h3>
        <p className="text-sm text-slate-500 mb-8">Messages disappear after the session. Express yourself freely.</p>
        <button 
          onClick={onToggle}
          className="w-full py-4 bg-,linear-to-r from-accent to-orange-400 text-twilight-dark font-bold rounded-2xl shadow-lg"
        >
          Enter the Glow
        </button>
      </div>
    </div>
  );
};