import { useState, useEffect, useCallback } from "react";
import {
  PrivyProvider,
  usePrivy,
  useFundWallet,
  useSendTransaction,
} from "@privy-io/react-auth";
import { polygon, polygonAmoy } from "@privy-io/chains";
import { createPublicClient, http, formatUnits } from "viem";
import { polygon as viemPolygon } from "viem/chains";

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

const USDC_ADDRESS: `0x${string}` = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const POLYGON_CHAIN_ID = 137;
const TRANSFER_SELECTOR = "0xa9059cbb";

const publicClient = createPublicClient({
  chain: viemPolygon,
  transport: http(),
});

function encodeErc20Transfer(to: string, amount: bigint): string {
  const paddedAddr = to.slice(2).padStart(64, "0");
  const paddedAmt = amount.toString(16).padStart(64, "0");
  return TRANSFER_SELECTOR + paddedAddr + paddedAmt;
}

type TransferAsset = "POL" | "USDC";

function TransferFunds({
  fromAddress,
  onTransferComplete,
}: {
  fromAddress: string;
  onTransferComplete: () => void;
}) {
  const { sendTransaction } = useSendTransaction();
  const [open, setOpen] = useState(false);
  const [asset, setAsset] = useState<TransferAsset>("USDC");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setError(null);
    setTxHash(null);

    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      setError("Invalid wallet address");
      return;
    }

    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError("Enter a valid amount");
      return;
    }

    setSending(true);
    try {
      let result;

      if (asset === "POL") {
        const valueWei = BigInt(Math.floor(parsed * 1e18));
        result = await sendTransaction(
          {
            to: recipient as `0x${string}`,
            value: valueWei,
            chainId: POLYGON_CHAIN_ID,
          },
          { address: fromAddress as `0x${string}` },
        );
      } else {
        const amountUnits = BigInt(Math.floor(parsed * 1e6));
        const data = encodeErc20Transfer(recipient, amountUnits);
        result = await sendTransaction(
          {
            to: USDC_ADDRESS as `0x${string}`,
            data: data as `0x${string}`,
            chainId: POLYGON_CHAIN_ID,
          },
          { address: fromAddress as `0x${string}` },
        );
      }

      setTxHash(result.hash);
      setAmount("");
      setRecipient("");
      onTransferComplete();
    } catch (err) {
      console.error("Transfer error:", err);
      setError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "12px 32px",
          fontSize: "16px",
          background: "#6366f1",
          color: "white",
          border: "none",
          borderRadius: "12px",
          cursor: "pointer",
          fontWeight: 600,
          marginBottom: "12px",
          width: "100%",
        }}
      >
        Transfer Funds
      </button>
    );
  }

  return (
    <div
      style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "16px 20px",
        marginBottom: "24px",
        minWidth: "280px",
        textAlign: "left",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "14px",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: "14px", color: "#374151" }}>
          Transfer Funds
        </span>
        <button
          onClick={() => {
            setOpen(false);
            setError(null);
            setTxHash(null);
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "16px",
            color: "#9ca3af",
            padding: "0 4px",
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        {(["USDC", "POL"] as TransferAsset[]).map((a) => (
          <button
            key={a}
            onClick={() => setAsset(a)}
            style={{
              flex: 1,
              padding: "8px",
              fontSize: "13px",
              fontWeight: 600,
              borderRadius: "8px",
              border: "1px solid",
              borderColor: asset === a ? "#6366f1" : "#e5e7eb",
              background: asset === a ? "#eef2ff" : "white",
              color: asset === a ? "#6366f1" : "#6b7280",
              cursor: "pointer",
            }}
          >
            {a}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Recipient address (0x...)"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          fontSize: "13px",
          fontFamily: "monospace",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          marginBottom: "8px",
          boxSizing: "border-box",
        }}
      />

      <input
        type="number"
        placeholder={`Amount in ${asset}`}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min="0"
        step={asset === "USDC" ? "0.01" : "0.000001"}
        style={{
          width: "100%",
          padding: "10px 12px",
          fontSize: "13px",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          marginBottom: "12px",
          boxSizing: "border-box",
        }}
      />

      <button
        onClick={handleSend}
        disabled={sending}
        style={{
          width: "100%",
          padding: "12px",
          fontSize: "15px",
          fontWeight: 600,
          background: sending ? "#a5b4fc" : "#6366f1",
          color: "white",
          border: "none",
          borderRadius: "10px",
          cursor: sending ? "default" : "pointer",
        }}
      >
        {sending ? "Sending..." : `Send ${asset}`}
      </button>

      {error && (
        <p
          style={{
            color: "#ef4444",
            fontSize: "12px",
            marginTop: "10px",
            marginBottom: 0,
            wordBreak: "break-word",
          }}
        >
          {error}
        </p>
      )}

      {txHash && (
        <p
          style={{
            color: "#10b981",
            fontSize: "12px",
            marginTop: "10px",
            marginBottom: 0,
            wordBreak: "break-all",
          }}
        >
          Sent!{" "}
          <a
            href={`https://polygonscan.com/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#6366f1" }}
          >
            View on PolygonScan
          </a>
        </p>
      )}
    </div>
  );
}

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
        publicClient.readContract({
          address: USDC_ADDRESS,
          abi: USDC_ABI,
          functionName: "balanceOf",
          args: [walletAddress],
        }),
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
          <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>POL</p>
          <p style={{ fontSize: "24px", fontWeight: "bold", margin: "4px 0 0" }}>
            {loading
              ? "..."
              : nativeBalance
                ? Number(nativeBalance).toFixed(4)
                : "-"}
          </p>
        </div>
      </div>

      {walletAddress && (
        <TransferFunds
          fromAddress={walletAddress}
          onTransferComplete={fetchBalances}
        />
      )}

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
          width: "100%",
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
