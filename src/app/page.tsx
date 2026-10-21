"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import { fetchLiveVotes, submitVote, resetDatabaseVotes } from "@/app/actions/voting";

const N = [
  "Bank Mandiri",
  "AFPI",
  "Bank Central Asia",
  "Bank Mega",
  "Bank Jakarta",
  "OJK Jabodebek",
  "Bank Indonesia",
  "Bank Rakyat Indonesia",
  "Bank Negara Indonesia",
  "Bank Syariah Indonesia",
  "Netzme",
  "Pegadaian",
  "Bank Tabungan Negara",
  "CIMB Niaga",
  "Bursa Efek Indonesia",
  "OCBC Sekuritas",
  "MNC Sekuritas",
  "Panin Bank",
  "Permata Bank",
  "Bank Syariah Nasional",
  "AAUI",
  "Himbarsi",
  "Sompo Insurance",
];

const C = ["#1f4e8c", "#c8282f", "#3d9a5b", "#d99a00", "#7b4fa0", "#0f8b9d"];

const LOGOS: Record<string, string> = {
  "Bank Mandiri": "/logos/mandiri.png",
  "AFPI": "/logos/afpi.png",
  "Bank Central Asia": "/logos/bca.png",
  "Bank Mega": "/logos/mega.png",
  "Bank Jakarta": "/logos/bank_jakarta.png",
  "OJK Jabodebek": "/logos/ojk.PNG",
  "Bank Indonesia": "/logos/bi.PNG",
  "Bank Rakyat Indonesia": "/logos/bri.png",
  "Bank Negara Indonesia": "/logos/bni.png",
  "Bank Syariah Indonesia": "/logos/bsi.WEBP",
  "Netzme": "/logos/netzme.PNG",
  "Neto Me": "/logos/netzme.PNG",
  "Pegadaian": "/logos/pegadaian.png",
  "Bank Tabungan Negara": "/logos/btn.PNG",
  "CIMB Niaga": "/logos/cimb.png",
  "Bursa Efek Indonesia": "/logos/idx.png",
  "OCBC Sekuritas": "/logos/ocbc.PNG",
  "MNC Sekuritas": "/logos/mnc.PNG",
  "Panin Bank": "/logos/panin.png",
  "Permata Bank": "/logos/permata.WEBP",
  "Bank Syariah Nasional": "/logos/Logo_Bank_Syariah_Nasional.svg",
  "AAUI": "/logos/aaui.PNG",
  "Himbarsi": "/logos/himbarsi.PNG",
  "Himbansi": "/logos/himbarsi.PNG",
  "Sompo Insurance": "/logos/sompo.png",
  "Sompo": "/logos/sompo.png",
};

const T: Record<"edu" | "inter", [string, string]> = {
  edu: ["Booth Teredukatif", "Booth mana yang paling bikin kamu paham?"],
  inter: ["Booth Terinteraktif", "Booth mana yang paling seru buat kamu?"],
};

function getInitials(name: string): string {
  const w = name.replace(/^Bank /, "").split(" ");
  return (w[0][0] + (w[1] ? w[1][0] : w[0][1] || "")).toUpperCase();
}

const STORAGE_KEY = "jff2026_dynamic_votes_v2";
const HIDDEN_KEY = "jff2026_hidden_booths_v1";

interface VoteData {
  edu: number[];
  inter: number[];
}

function getInitialVotes(): VoteData {
  return {
    edu: new Array(N.length).fill(0),
    inter: new Array(N.length).fill(0),
  };
}

export default function VotingApp() {
  const [category, setCategory] = useState<"edu" | "inter">("edu");
  const [viewPage, setViewPage] = useState<"vote" | "hasil">("vote");
  const [votes, setVotes] = useState<VoteData>(getInitialVotes);
  const [hiddenBooths, setHiddenBooths] = useState<string[]>([]);
  const [isManageModalOpen, setIsManageModalOpen] = useState<boolean>(false);
  const [manageSearch, setManageSearch] = useState<string>("");
  const [isNeonConnected, setIsNeonConnected] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [showToast, setShowToast] = useState<boolean>(false);
  const [poppingName, setPoppingName] = useState<string | null>(null);

  const bubRef = useRef<HTMLDivElement>(null);
  const [bubbleSize, setBubbleSize] = useState<number>(100);

  // Sync data from Neon (or fallback to localStorage)
  const syncWithServer = useCallback(async () => {
    try {
      const res = await fetchLiveVotes();
      if (res.isNeonConnected) {
        setIsNeonConnected(true);
        const newEdu = N.map((name) => res.edu[name] || 0);
        const newInter = N.map((name) => res.inter[name] || 0);
        setVotes({ edu: newEdu, inter: newInter });
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ edu: newEdu, inter: newInter }));
        } catch (_) {}
      }
    } catch (e) {
      console.error("Live sync error", e);
    }
  }, []);

  // Load votes & hidden list on mount & set up live polling
  useEffect(() => {
    // 1. Initial instant load from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.edu) && Array.isArray(parsed.inter)) {
          const newEdu = new Array(N.length).fill(0);
          const newInter = new Array(N.length).fill(0);
          parsed.edu.forEach((v: number, i: number) => {
            if (i < N.length) newEdu[i] = v;
          });
          parsed.inter.forEach((v: number, i: number) => {
            if (i < N.length) newInter[i] = v;
          });
          setVotes({ edu: newEdu, inter: newInter });
        }
      }

      // Load hidden booths
      const savedHidden = localStorage.getItem(HIDDEN_KEY);
      if (savedHidden) {
        const parsedHidden = JSON.parse(savedHidden);
        if (Array.isArray(parsedHidden)) {
          setHiddenBooths(parsedHidden);
        }
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Fetch live data from Neon
    syncWithServer();

    // 3. Poll every 3.5 seconds for real-time multi-device sync
    const interval = setInterval(syncWithServer, 3500);
    return () => clearInterval(interval);
  }, [syncWithServer]);

  // Save votes to localStorage whenever updated
  const saveVotes = (updated: VoteData) => {
    setVotes(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Toast notification
  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    const timer = setTimeout(() => {
      setShowToast(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  // Toggle hiding a booth
  const toggleHideBooth = (name: string) => {
    setHiddenBooths((prev) => {
      const isCurrentlyHidden = prev.includes(name);
      const next = isCurrentlyHidden ? prev.filter((b) => b !== name) : [...prev, name];
      try {
        localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
      } catch (_) {}
      triggerToast(
        isCurrentlyHidden
          ? `${name} ditampilkan kembali.`
          : `${name} disembunyikan dari layar.`
      );
      return next;
    });
  };

  // Show all booths
  const showAllBooths = () => {
    setHiddenBooths([]);
    try {
      localStorage.removeItem(HIDDEN_KEY);
    } catch (_) {}
    triggerToast("Semua booth sekarang ditampilkan.");
  };

  // Filter visible booths
  const visibleBooths = N.filter((name) => !hiddenBooths.includes(name));

  // Dynamic 3-row distribution for visible booths
  const r1Count = Math.ceil(visibleBooths.length / 3);
  const r2Count = Math.ceil((visibleBooths.length - r1Count) / 2);
  const row1 = visibleBooths.slice(0, r1Count);
  const row2 = visibleBooths.slice(r1Count, r1Count + r2Count);
  const row3 = visibleBooths.slice(r1Count + r2Count);

  // Responsive bubble layout calculator
  const updateBubbleLayout = useCallback(() => {
    if (!bubRef.current) return;
    const w = bubRef.current.clientWidth;
    const h = bubRef.current.clientHeight;

    const maxCols = Math.max(row1.length, row2.length, row3.length, 1);
    const rowCount = [row1, row2, row3].filter((r) => r.length > 0).length || 1;

    const computed = Math.max(
      36,
      Math.floor(
        Math.min(
          (w - (maxCols - 1) * 8) / maxCols,
          (h - (rowCount - 1) * 8) / rowCount,
          140
        )
      )
    );
    setBubbleSize(computed);
  }, [row1.length, row2.length, row3.length]);

  useEffect(() => {
    updateBubbleLayout();
    window.addEventListener("resize", updateBubbleLayout);
    return () => window.removeEventListener("resize", updateBubbleLayout);
  }, [updateBubbleLayout, viewPage, visibleBooths.length]);

  // Click on booth bubble to vote
  const handleVote = (boothName: string) => {
    const idx = N.indexOf(boothName);
    if (idx === -1) return;

    setPoppingName(boothName);
    setTimeout(() => setPoppingName(null), 400);

    // Optimistic UI update
    const nextVotes = {
      ...votes,
      [category]: votes[category].map((count, i) =>
        i === idx ? count + 1 : count
      ),
    };
    saveVotes(nextVotes);

    // Save to Neon PostgreSQL
    submitVote(category, boothName).then((res) => {
      if (res.isNeonConnected && !isNeonConnected) {
        setIsNeonConnected(true);
      }
    });

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.65 },
        colors: [C[idx % 6], "#1f4e8c", "#d99a00"],
      });
    } catch (_) {}

    triggerToast(`Terima kasih! Suara untuk ${boothName} tercatat.`);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {
          triggerToast("Layar penuh diblokir di pratinjau browser.");
        });
      } else {
        document.exitFullscreen().catch(() => {});
      }
    } catch (_) {
      triggerToast("Layar penuh tidak didukung di sini.");
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const rows = [
      ["No", "Nama Booth", "Suara Teredukatif", "Suara Terinteraktif", "Total", "Status"],
      ...N.map((name, i) => [
        i + 1,
        `"${name}"`,
        votes.edu[i],
        votes.inter[i],
        votes.edu[i] + votes.inter[i],
        hiddenBooths.includes(name) ? "Disembunyikan" : "Aktif",
      ]),
    ];
    const csvContent = rows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Hasil_Voting_JFF2026_${category}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Reset votes
  const handleReset = async () => {
    if (window.confirm("Apakah Anda yakin ingin me-reset semua suara menjadi 0?")) {
      const empty = getInitialVotes();
      saveVotes(empty);
      if (isNeonConnected) {
        await resetDatabaseVotes();
      }
      triggerToast("Semua suara telah di-reset ke 0.");
    }
  };

  // Results calculation (only visible booths in active leaderboard)
  const currentCategoryVotes = votes[category];
  const rankedResults = visibleBooths
    .map((name) => {
      const originalIdx = N.indexOf(name);
      return {
        name,
        votes: originalIdx !== -1 ? currentCategoryVotes[originalIdx] : 0,
        originalIdx,
      };
    })
    .sort((a, b) => b.votes - a.votes);

  const totalVotes = rankedResults.reduce((sum, item) => sum + item.votes, 0);
  const maxVotes = rankedResults[0]?.votes || 1;

  const renderBubble = (name: string) => {
    const idx = N.indexOf(name);
    const isPopping = poppingName === name;
    const logoUrl = LOGOS[name];

    return (
      <button
        key={name}
        className={`b ${logoUrl ? "has-logo" : ""} ${isPopping ? "pop" : ""}`}
        onClick={() => handleVote(name)}
        style={{
          width: `${bubbleSize}px`,
          height: `${bubbleSize}px`,
          background: logoUrl ? "#ffffff" : C[idx >= 0 ? idx % 6 : 0],
          borderColor: logoUrl ? C[idx >= 0 ? idx % 6 : 0] : "#ffffff",
        }}
        aria-label={`Pilih ${name}`}
      >
        {logoUrl ? (
          <img src={logoUrl} alt={name} />
        ) : (
          <>
            <span style={{ fontSize: `${Math.round(bubbleSize * 0.3)}px` }}>
              {getInitials(name)}
            </span>
            <small
              style={{
                fontSize: `${Math.max(9, Math.round(bubbleSize * 0.1))}px`,
                display: bubbleSize >= 80 ? "-webkit-box" : "none",
              }}
            >
              {name}
            </small>
          </>
        )}
      </button>
    );
  };

  return (
    <>
      <div id="root-container">
        {/* Header Card (Clean & Compact) */}
        <div className="hd">
          <h1>{viewPage === "hasil" ? `Hasil ${T[category][0]}` : T[category][0]}</h1>
          <p>
            {viewPage === "hasil"
              ? "Perolehan suara terakumulasi langsung secara dinamis."
              : `${T[category][1]} Ketuk logo untuk memilih.`}
          </p>
        </div>

        {/* Voting View */}
        {viewPage === "vote" && (
          <div className="bub" ref={bubRef}>
            {visibleBooths.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "36px 24px",
                  background: "var(--card)",
                  borderRadius: "20px",
                  margin: "auto",
                  maxWidth: "460px",
                  boxShadow: "0 10px 30px rgba(31, 78, 140, 0.15)",
                }}
              >
                <div style={{ fontSize: "36px", marginBottom: "8px" }}>🏦</div>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: "800",
                    color: "var(--navy)",
                    marginBottom: "8px",
                  }}
                >
                  Semua Booth Disembunyikan
                </h3>
                <p
                  style={{
                    color: "var(--muted)",
                    fontSize: "14px",
                    fontWeight: "600",
                    marginBottom: "18px",
                  }}
                >
                  Tidak ada booth yang aktif saat ini. Buka menu kelola untuk menampilkan booth kembali.
                </p>
                <button
                  onClick={showAllBooths}
                  style={{
                    background: "var(--navy)",
                    color: "#fff",
                    border: "none",
                    padding: "10px 22px",
                    borderRadius: "99px",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Tampilkan Semua Booth
                </button>
              </div>
            ) : (
              <>
                {/* Row 1 */}
                {row1.length > 0 && (
                  <div className="rw">
                    {row1.map((name) => renderBubble(name))}
                  </div>
                )}

                {/* Row 2 */}
                {row2.length > 0 && (
                  <div className="rw">
                    {row2.map((name) => renderBubble(name))}
                  </div>
                )}

                {/* Row 3 */}
                {row3.length > 0 && (
                  <div className="rw">
                    {row3.map((name) => renderBubble(name))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Results View */}
        {viewPage === "hasil" && (
          <div className="res">
            <div className="tot">
              <div>
                <span>Total suara: {totalVotes}</span>
                {hiddenBooths.length > 0 && (
                  <span
                    style={{
                      marginLeft: "10px",
                      color: "#c8282f",
                      fontSize: "11px",
                      fontWeight: "700",
                    }}
                  >
                    ({hiddenBooths.length} disembunyikan)
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  onClick={() => setIsManageModalOpen(true)}
                  style={{
                    background: "none",
                    border: "1px solid var(--navy)",
                    borderRadius: "6px",
                    padding: "3px 8px",
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "var(--navy)",
                    cursor: "pointer",
                  }}
                >
                  Kelola Booth ({visibleBooths.length}/{N.length})
                </button>
                <button
                  onClick={handleExportCSV}
                  style={{
                    background: "none",
                    border: "1px solid var(--line)",
                    borderRadius: "6px",
                    padding: "3px 8px",
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "var(--navy)",
                    cursor: "pointer",
                  }}
                >
                  Export CSV
                </button>
                <button
                  onClick={handleReset}
                  style={{
                    background: "none",
                    border: "1px solid #ffccd0",
                    borderRadius: "6px",
                    padding: "3px 8px",
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "#c8282f",
                    cursor: "pointer",
                  }}
                >
                  Reset
                </button>
              </div>
            </div>

            {rankedResults.map((item, k) => {
              const widthPct = maxVotes > 0 ? (item.votes / maxVotes) * 100 : 0;
              const barColor =
                k === 0
                  ? "#d99a00"
                  : k === 1
                  ? "#1f4e8c"
                  : k === 2
                  ? "#3d9a5b"
                  : "#9db3d6";

              return (
                <div key={item.name} className="row">
                  <div className="rk">{k + 1}</div>
                  <div className="bar">
                    <div
                      className="fill"
                      style={{
                        width: `${Math.max(widthPct, item.votes > 0 ? 3 : 0)}%`,
                        background: barColor,
                      }}
                    />
                    <span className="bn" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      {LOGOS[item.name] && (
                        <img
                          src={LOGOS[item.name]}
                          alt=""
                          style={{
                            height: "18px",
                            width: "18px",
                            objectFit: "contain",
                            borderRadius: "4px",
                            background: "#fff",
                            padding: "1px",
                            verticalAlign: "middle",
                          }}
                        />
                      )}
                      {item.name}
                    </span>
                  </div>
                  <div className="rv">{item.votes}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Single Bottom Navigation Bar */}
      <div className="nav" id="nav">
        <button
          aria-pressed={category === "edu" && viewPage === "vote"}
          onClick={() => {
            setCategory("edu");
            setViewPage("vote");
          }}
        >
          Vote Teredukatif
        </button>
        <button
          aria-pressed={category === "inter" && viewPage === "vote"}
          onClick={() => {
            setCategory("inter");
            setViewPage("vote");
          }}
        >
          Vote Terinteraktif
        </button>
        <i className="sep" />
        <button
          aria-pressed={category === "edu" && viewPage === "hasil"}
          onClick={() => {
            setCategory("edu");
            setViewPage("hasil");
          }}
        >
          Hasil Teredukatif
        </button>
        <button
          aria-pressed={category === "inter" && viewPage === "hasil"}
          onClick={() => {
            setCategory("inter");
            setViewPage("hasil");
          }}
        >
          Hasil Terinteraktif
        </button>
        <i className="sep" />
        <button
          onClick={() => setIsManageModalOpen(true)}
          style={{
            position: "relative",
          }}
        >
          Kelola ({visibleBooths.length})
        </button>
        <i className="sep" />
        <button onClick={toggleFullscreen}>Layar penuh</button>
      </div>

      {/* Modal Kelola Booth */}
      {isManageModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsManageModalOpen(false)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Kelola Tampilan Booth</h2>
                <p>
                  {visibleBooths.length} dari {N.length} booth aktif ditampilkan
                </p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setIsManageModalOpen(false)}
                aria-label="Tutup modal"
              >
                ✕
              </button>
            </div>

            <div className="modal-toolbar">
              <input
                type="text"
                placeholder="Cari nama booth / bank..."
                value={manageSearch}
                onChange={(e) => setManageSearch(e.target.value)}
                className="modal-search"
              />
              {hiddenBooths.length > 0 && (
                <button
                  type="button"
                  className="modal-action-btn secondary"
                  onClick={showAllBooths}
                >
                  Tampilkan Semua ({hiddenBooths.length})
                </button>
              )}
            </div>

            <div className="modal-booth-list">
              {N.filter((name) =>
                name.toLowerCase().includes(manageSearch.toLowerCase())
              ).map((name) => {
                const isHidden = hiddenBooths.includes(name);
                const logoUrl = LOGOS[name];
                const originalIdx = N.indexOf(name);
                return (
                  <div
                    key={name}
                    className={`modal-booth-item ${isHidden ? "is-hidden" : ""}`}
                    onClick={() => toggleHideBooth(name)}
                  >
                    <div className="booth-item-left">
                      <div
                        className="booth-item-logo"
                        style={{
                          borderColor: logoUrl ? C[originalIdx % 6] : "#ddd",
                          background: logoUrl ? "#fff" : C[originalIdx % 6],
                          color: logoUrl ? "inherit" : "#fff",
                        }}
                      >
                        {logoUrl ? (
                          <img src={logoUrl} alt="" />
                        ) : (
                          <span>{getInitials(name)}</span>
                        )}
                      </div>
                      <div className="booth-item-info">
                        <div className="booth-item-name">{name}</div>
                        <div className="booth-item-status">
                          {isHidden ? "Disembunyikan" : "Tampil di layar"}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`booth-toggle-btn ${
                        isHidden ? "btn-hidden" : "btn-visible"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleHideBooth(name);
                      }}
                    >
                      {isHidden ? "Tampilkan" : "Sembunyikan"}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="modal-done-btn"
                onClick={() => setIsManageModalOpen(false)}
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      <div className={`toast ${showToast ? "show" : ""}`} role="status">
        {toastMessage}
      </div>
    </>
  );
}
