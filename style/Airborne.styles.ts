import { StyleSheet } from "react-native";

const COLORS = {
  primary: "#111113",
  sky: "#ff8a1d",
  aqua: "#ffb347",
  mint: "#f2f2f2",
  danger: "#ff6b6b",
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  skyGlowTop: {
    position: "absolute",
    top: -80,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(255, 138, 29, 0.12)",
  },
  skyGlowBottom: {
    position: "absolute",
    left: -60,
    bottom: 90,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(170, 170, 170, 0.08)",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  brand: {
    color: COLORS.mint,
    fontSize: 32,
    fontWeight: "900",
  },
  brandAccent: {
    color: COLORS.aqua,
  },
  subtitle: {
    marginTop: 6,
    color: COLORS.aqua,
    fontSize: 12,
    fontWeight: "600",
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  levelBadge: {
    minWidth: 84,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: "rgba(255, 138, 29, 0.25)",
  },
  levelBadgeText: {
    color: COLORS.mint,
    fontSize: 13,
    fontWeight: "800",
  },
  quickStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
    marginBottom: 8,
  },
  statCard: {
    width: "50%",
    paddingHorizontal: 6,
    paddingBottom: 12,
  },
  statCardAmber: {
    paddingBottom: 12,
  },
  statCardGreen: {
    paddingBottom: 12,
  },
  statNumber: {
    color: COLORS.mint,
    fontSize: 24,
    fontWeight: "900",
  },
  statLabel: {
    marginTop: 4,
    color: COLORS.aqua,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "lowercase",
  },
  container: {
    padding: 18,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 138, 29, 0.25)",
  },
  banner: {
    backgroundColor: "rgba(255, 138, 29, 0.08)",
    borderWidth: 1,
    borderColor: COLORS.sky,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 14,
  },
  bannerText: {
    color: COLORS.aqua,
    fontWeight: "800",
    fontSize: 16,
  },
  lead: {
    color: COLORS.mint,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  flightPanel: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: "rgba(31, 31, 35, 0.45)",
    borderWidth: 1,
    borderColor: "rgba(255, 138, 29, 0.18)",
    marginBottom: 16,
  },
  panelLabel: {
    color: COLORS.aqua,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  currentCheckpoint: {
    color: COLORS.mint,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6,
  },
  nextCheckpoint: {
    color: COLORS.aqua,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
  },
  timerText: {
    color: COLORS.aqua,
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 12,
  },
  flightTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    overflow: "hidden",
  },
  flightProgress: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: COLORS.aqua,
  },
  controls: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  button: {
    backgroundColor: COLORS.sky,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonAlt: {
    backgroundColor: COLORS.aqua,
  },
  emergencyBtn: {
    backgroundColor: COLORS.danger,
  },
  buttonText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 13,
  },
});

export default styles;
