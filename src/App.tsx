import { PrivyProvider, usePrivy, useFundWallet } from "@privy-io/react-auth";
import { polygon, polygonAmoy } from "@privy-io/chains";

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID as string;

function FundButton() {
  const { ready, authenticated, login, user, logout } = usePrivy();
  const { fundWallet } = useFundWallet();

  if (!ready) return <p style={{ color: "#888" }}>Loading Privy...</p>;

  if (!authenticated) {
    return (
      <button
        onClick={login}
        style={{
          padding: "16px 32px",
          fontSize: "18px",
          background: "#6366f1",
          color: "white",
          border: "none",
          borderRadius: "12px",
          cursor: "pointer",
        }}
      >
        Login to Test On-Ramp
      </button>
    );
  }

  const walletAddress = user?.wallet?.address ?? "";

  const handleFund = async () => {
    if (!walletAddress) {
      alert("No wallet address found");
      return;
    }
    try {
      await fundWallet({
        address: walletAddress,
        options: {
          chain: polygon,
          asset: "USDC",
        },
      });
    } catch (err) {
      console.error("Fund wallet error:", err);
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ marginBottom: "8px", color: "#666" }}>
        Logged in as: {user?.email?.address ?? "unknown"}
      </p>
      <p
        style={{
          marginBottom: "24px",
          fontFamily: "monospace",
          fontSize: "12px",
          background: "#f3f4f6",
          padding: "8px 12px",
          borderRadius: "8px",
          wordBreak: "break-all",
        }}
      >
        Wallet: {walletAddress || "No wallet"}
      </p>

      <button
        onClick={handleFund}
        style={{
          padding: "16px 48px",
          fontSize: "20px",
          background: "#10b981",
          color: "white",
          border: "none",
          borderRadius: "12px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Buy USDC (MoonPay)
      </button>

      <br />
      <button
        onClick={logout}
        style={{
          marginTop: "16px",
          padding: "8px 16px",
          fontSize: "14px",
          background: "transparent",
          color: "#888",
          border: "1px solid #ddd",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </div>
  );
}

function App() {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#6366f1",
        },
        loginMethods: ["email", "google"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        supportedChains: [polygonAmoy, polygon],
        defaultChain: polygonAmoy,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "system-ui, sans-serif",
          padding: "20px",
        }}
      >
        <h1 style={{ marginBottom: "8px" }}>WeXare On-Ramp Test</h1>
        <p style={{ marginBottom: "32px", color: "#888" }}>
          Test MoonPay on-ramp via Privy
        </p>
        <FundButton />
      </div>
    </PrivyProvider>
  );
}

export default App;
