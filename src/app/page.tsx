"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import { fetchLiveVotes, submitVote } from "@/app/actions/voting";

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
  "MNC Sekuritas",
  "Panin Bank",
  "Permata Bank",
  "Bank Syariah Nasional",
  "Bank Sukma Hitamajaya",
  "AAUI",
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
  "MNC Sekuritas": "/logos/mnc.PNG",
  "Panin Bank": "/logos/panin.png",
  "Permata Bank": "/logos/permata.WEBP",
  "Bank Syariah Nasional": "/logos/Logo_Bank_Syariah_Nasional.svg",
  "Bank Sukma Hitamajaya": "/logos/sukma.png",
  "AAUI": "/logos/aaui.PNG",
};

const T: Record<"edu" | "inter", [string, string]> = {
  edu: ["Booth Teredukatif", "Booth mana yang paling bikin kamu paham?"],
  inter: ["Booth Terinteraktif", "Booth mana yang paling seru buat kamu?"],
};

function getInitials(name: string): string {
  const w = name.replace(/^Bank /, "").split(" ");
  return (w[0][0] + (w[1] ? w[1][0] : w[0][1] || "")).toUpperCase();
}

function formatTanggalIndo(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-").map(Number);
    if (parts.length !== 3) return dateStr;
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (_) {
    return dateStr;
  }
}

const STORAGE_KEY = "jff2026_dynamic_votes_v5";
const HIDDEN_KEY = "jff2026_hidden_booths_v4";

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

// Calculate rows dynamically based on visible booths and screen type
function getRows(booths: string[], isMobile: boolean): string[][] {
  if (booths.length === 0) return [];
  // Mobile (< 640px): 5 rows of 4-5
  // iPad (landscape & portrait) and Desktop: 3 rows (7 - 7 - 7 for 21 booths)
  const numRows = isMobile ? (booths.length > 15 ? 5 : 4) : 3;

  const rows: string[][] = [];
  let remaining = [...booths];

  for (let r = 0; r < numRows; r++) {
    const rowsLeft = numRows - r;
    const countThisRow = Math.ceil(remaining.length / rowsLeft);
    if (countThisRow > 0) {
      rows.push(remaining.slice(0, countThisRow));
      remaining = remaining.slice(countThisRow);
    }
  }

  return rows.filter((r) => r.length > 0);
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
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isNavVisible, setIsNavVisible] = useState<boolean>(true);

  // Rekap Feature State (All, Today, Yesterday, Tomorrow, or Custom Date)
  const [rekapPeriod, setRekapPeriod] = useState<string>("all");
  const [customDate, setCustomDate] = useState<string>("");
  const [serverToday, setServerToday] = useState<string>("");
  const [serverYesterday, setServerYesterday] = useState<string>("");
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  const bubRef = useRef<HTMLDivElement>(null);
  const [bubbleSize, setBubbleSize] = useState<number>(94);

  // Detect mobile vs iPad/desktop
  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  // Sync data from Neon (or fallback to localStorage) with active filter
  const syncWithServer = useCallback(async (periodToFetch?: string) => {
    const targetPeriod = periodToFetch !== undefined ? periodToFetch : (viewPage === "hasil" ? rekapPeriod : "all");
    try {
      const res = await fetchLiveVotes(targetPeriod);
      if (res.isNeonConnected) {
        setIsNeonConnected(true);
        const newEdu = N.map((name) => res.edu[name] || 0);
        const newInter = N.map((name) => res.inter[name] || 0);
        setVotes({ edu: newEdu, inter: newInter });
        if (res.serverToday) setServerToday(res.serverToday);
        if (res.serverYesterday) setServerYesterday(res.serverYesterday);
        if (res.availableDates) setAvailableDates(res.availableDates);

        if (targetPeriod === "all") {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ edu: newEdu, inter: newInter }));
          } catch (_) {}
        }
      }
    } catch (e) {
      console.error("Live sync error", e);
    }
  }, [viewPage, rekapPeriod]);

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
          setHiddenBooths(parsedHidden.filter((b) => N.includes(b)));
        }
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Fetch live data from Neon
    syncWithServer();

    // 3. Poll every 3.5 seconds for real-time multi-device sync
    const interval = setInterval(() => {
      syncWithServer();
    }, 3500);
    return () => clearInterval(interval);
  }, [syncWithServer]);

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
  const rows = getRows(visibleBooths, isMobile);

  // Responsive bubble layout calculator (iPad 10th Gen & Mobile optimized)
  const updateBubbleLayout = useCallback(() => {
    if (!bubRef.current) return;
    const w = bubRef.current.clientWidth;
    const h = bubRef.current.clientHeight;

    const maxCols = Math.max(...rows.map((r) => r.length), 1);
    const rowCount = Math.max(rows.length, 1);
    const gap = isMobile ? 6 : 8;

    // iPad 10th Gen (820px portrait, 1180px landscape):
    // Maximum bubble size ~94px ensures circles do not dominate the background
    // and logo images inside sit with clean, balanced white margins.
    const maxAllowed = isMobile ? 60 : 94;

    const computed = Math.max(
      34,
      Math.floor(
        Math.min(
          (w - (maxCols - 1) * gap) / maxCols,
          (h - (rowCount - 1) * gap) / rowCount,
          maxAllowed
        )
      )
    );
    setBubbleSize(computed);
  }, [rows, isMobile]);

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
    setVotes(nextVotes);

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

  // Helper label for active recap period
  const getPeriodLabel = (period: string): string => {
    if (period === "all") return "Akumulasi Seluruh Hari Festival";
    if (period === "today") return `Hari Ini (${serverToday ? formatTanggalIndo(serverToday) : "Hari Ini"})`;
    if (period === "yesterday") return `Kemarin (${serverYesterday ? formatTanggalIndo(serverYesterday) : "Kemarin"})`;
    if (period === "tomorrow") return "Besok";
    return `Tanggal ${formatTanggalIndo(period)}`;
  };

  // Export CSV based on currently selected recap period
  const handleExportCSV = () => {
    const periodName = rekapPeriod === "all" ? "Semua_Hari" : rekapPeriod;
    const rowsData = [
      ["Rekap Hasil Voting Jakarta Financial Festival 2026"],
      [`Kategori`, `"${T[category][0]}"`],
      [`Periode Rekap`, `"${getPeriodLabel(rekapPeriod)}"`],
      [`Waktu Ekspor`, `"${new Date().toLocaleString("id-ID")}"`],
      [],
      ["Peringkat", "Nama Booth", "Jumlah Suara", "Status"],
      ...rankedResults.map((item, i) => [
        i + 1,
        `"${item.name}"`,
        item.votes,
        hiddenBooths.includes(item.name) ? "Disembunyikan" : "Aktif",
      ]),
    ];
    const csvContent = rowsData.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Rekap_Voting_JFF2026_${category}_${periodName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast(`Rekap CSV (${getPeriodLabel(rekapPeriod)}) berhasil diunduh.`);
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
          borderWidth: "3px",
          borderStyle: "solid",
          backgroundClip: "padding-box",
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
                display: bubbleSize >= 75 ? "-webkit-box" : "none",
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
        {/* Header Card (Clean, Compact, Safely Below Banner) */}
        <div className="hd">
          <h1>{viewPage === "hasil" ? `Rekap ${T[category][0]}` : T[category][0]}</h1>
          <p>
            {viewPage === "hasil"
              ? `Hasil perolehan suara resmi Jakarta Financial Festival 2026.`
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
                  padding: "32px 20px",
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
              rows.map((row, rowIdx) => (
                <div key={`row-${rowIdx}`} className="rw">
                  {row.map((name) => renderBubble(name))}
                </div>
              ))
            )}
          </div>
        )}

        {/* Results / Rekap View */}
        {viewPage === "hasil" && (
          <div className="res">
            {/* Rekap Period Filter Bar */}
            <div className="rekap-bar">
              <div className="rekap-tabs-row">
                <div className="rekap-tabs">
                  <button
                    type="button"
                    className={`rekap-tab ${rekapPeriod === "all" ? "active" : ""}`}
                    onClick={() => {
                      setRekapPeriod("all");
                      syncWithServer("all");
                    }}
                  >
                    Semua Hari
                  </button>
                  <button
                    type="button"
                    className={`rekap-tab ${rekapPeriod === "today" ? "active" : ""}`}
                    onClick={() => {
                      setRekapPeriod("today");
                      syncWithServer("today");
                    }}
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    className={`rekap-tab ${rekapPeriod === "yesterday" ? "active" : ""}`}
                    onClick={() => {
                      setRekapPeriod("yesterday");
                      syncWithServer("yesterday");
                    }}
                  >
                    Kemarin
                  </button>
                </div>

                <div className="rekap-date-picker">
                  <label htmlFor="rekap-custom-date">Pilih Hari:</label>
                  <input
                    id="rekap-custom-date"
                    type="date"
                    className="rekap-date-input"
                    value={customDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomDate(val);
                      if (val) {
                        setRekapPeriod(val);
                        syncWithServer(val);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="rekap-info-row">
                <span>
                  Periode Rekap: <strong>{getPeriodLabel(rekapPeriod)}</strong>
                </span>
                <span>
                  Total Terkumpul: <strong>{totalVotes} suara</strong>
                </span>
              </div>
            </div>

            <div className="tot">
              <div>
                <span>Perolehan Suara: {totalVotes}</span>
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
                  type="button"
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
                  Kelola ({visibleBooths.length}/{N.length})
                </button>
                <button
                  type="button"
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
                  Export CSV ({rekapPeriod === "all" ? "Semua" : rekapPeriod === "today" ? "Hari Ini" : rekapPeriod === "yesterday" ? "Kemarin" : "Periode"})
                </button>
              </div>
            </div>

            {totalVotes === 0 ? (
              <div className="rekap-empty">
                <div style={{ fontSize: "28px", marginBottom: "6px" }}>📭</div>
                <h4>Belum Ada Suara Tercatat</h4>
                <p>Tidak ada perolehan suara untuk {getPeriodLabel(rekapPeriod)}.</p>
              </div>
            ) : (
              rankedResults.map((item, k) => {
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
              })
            )}
          </div>
        )}
      </div>

      {/* Floating Expand Button when Nav is Hidden */}
      {!isNavVisible && (
        <button
          className="nav-expand-btn"
          onClick={() => setIsNavVisible(true)}
          title="Tampilkan menu navigasi"
        >
          ▲ Menu Navigasi
        </button>
      )}

      {/* Single Bottom Navigation Bar (Docked low & Collapsible) */}
      <div className={`nav ${!isNavVisible ? "is-hidden" : ""}`} id="nav">
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
        <i className="sep" />
        <button
          className="nav-toggle-btn"
          onClick={() => setIsNavVisible(false)}
          title="Sembunyikan bilah navigasi"
        >
          ▼ Tutup
        </button>
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
