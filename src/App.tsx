import { useState, useEffect, useCallback } from "react";
import { PrivyProvider, usePrivy, useFundWallet } from "@privy-io/react-auth";
import { polygon, polygonAmoy } from "@privy-io/chains";
import { createPublicClient, http, formatUnits } from "viem";
import { polygon as viemPolygon, polygonAmoy as viemAmoy } from "viem/chains";

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID as string;

const USDC_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// USDC contract addresses
const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  137: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",   // Polygon mainnet
  80002: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582", // Polygon Amoy testnet
};

const viemChain = viemPolygon;
const usdcAddress = USDC_ADDRESSES[137];

const publicClient = createPublicClient({
  chain: viemChain,
  transport: http(),
});

function FundButton() {
  const { ready, authenticated, login, user, logout } = usePrivy();
  const { fundWallet } = useFundWallet();
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [nativeBalance, setNativeBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const walletAddress = user?.wallet?.address as `0x${string}` | undefined;

  const fetchBalances = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    try {
      const [usdc, native] = await Promise.all([
        usdcAddress
          ? publicClient.readContract({
              address: usdcAddress,
              abi: USDC_ABI,
              functionName: "balanceOf",
              args: [walletAddress],
            })
          : Promise.resolve(0n),
        publicClient.getBalance({ address: walletAddress }),
      ]);
      setUsdcBalance(formatUnits(usdc, 6));
      setNativeBalance(formatUnits(native, 18));
    } catch (err) {
      console.error("Balance error:", err);
      setUsdcBalance("error");
      setNativeBalance("error");
    }
    setLoading(false);
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) fetchBalances();
  }, [walletAddress, fetchBalances]);

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
      // Refresh balance after funding
      setTimeout(fetchBalances, 5000);
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
          marginBottom: "16px",
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

      {/* Balances */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          justifyContent: "center",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "12px",
            padding: "16px 24px",
            minWidth: "140px",
          }}
        >
          <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>USDC</p>
          <p style={{ fontSize: "24px", fontWeight: "bold", margin: "4px 0 0" }}>
            {loading ? "..." : usdcBalance ?? "-"}
          </p>
        </div>
        <div
          style={{
            background: "#f5f3ff",
            border: "1px solid #ddd6fe",
            borderRadius: "12px",
            padding: "16px 24px",
            minWidth: "140px",
          }}
        >
          <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>
            POL
          </p>
          <p style={{ fontSize: "24px", fontWeight: "bold", margin: "4px 0 0" }}>
            {loading ? "..." : nativeBalance ? Number(nativeBalance).toFixed(4) : "-"}
          </p>
        </div>
      </div>

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
        onClick={fetchBalances}
        style={{
          marginTop: "12px",
          padding: "8px 16px",
          fontSize: "14px",
          background: "#f3f4f6",
          color: "#333",
          border: "1px solid #ddd",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Refresh Balance
      </button>

      <br />
      <button
        onClick={logout}
        style={{
          marginTop: "12px",
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
