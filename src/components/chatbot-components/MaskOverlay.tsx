export const MaskOverlay = ({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md text-white">
      
      <div className="text-center space-y-6 px-6">

        {/* icon */}
        <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center">
          <span className="text-3xl opacity-70">◐</span>
        </div>

        {/* text */}
        <div>
          <h2 className="text-lg font-semibold">Mask Mode</h2>
          <p className="text-sm text-white/50 mt-2 max-w-xs mx-auto">
            Private session. Nothing is stored.  
            You can speak freely here.
          </p>
        </div>

        {/* button */}
        <button
          onClick={onToggle}
          className="px-6 py-3 bg-white text-black rounded-full text-sm font-medium hover:scale-105 transition"
        >
          Continue
        </button>
      </div>
    </div>
  );
};