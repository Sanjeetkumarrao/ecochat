// WelcomeScreen.jsx
export default function WelcomeScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full bg-dark-bg border-l border-dark-border select-none">
      <div className="text-center space-y-4">
        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
          <span className="text-4xl">💬</span>
        </div>
        <h2 className="text-2xl font-light text-dark-text">EchoChat</h2>
        <p className="text-dark-muted text-sm max-w-xs">
          Send and receive messages without keeping your phone online.<br />
          Use EchoChat on up to 4 linked devices.
        </p>
        <div className="border-t border-dark-border pt-4">
          <p className="text-dark-muted text-xs">End-to-end encrypted</p>
        </div>
      </div>
    </div>
  );
}
