import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, forwardRef } from 'react';
import styles from './CostComputePanel.module.css';
export const CostComputePanel = forwardRef(({ apiBaseUrl = 'http://localhost:3000' }, ref) => {
    const [usage, setUsage] = useState(null);
    const [agents, setAgents] = useState({});
    const [roi, setRoi] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [usageRes, agentsRes, roiRes] = await Promise.all([
                fetch(`${apiBaseUrl}/api/usage-summary`),
                fetch(`${apiBaseUrl}/api/agent-burn`),
                fetch(`${apiBaseUrl}/api/local-roi`),
            ]);
            if (!usageRes.ok || !agentsRes.ok || !roiRes.ok) {
                throw new Error('Failed to fetch cost data');
            }
            const usageData = await usageRes.json();
            const agentsData = await agentsRes.json();
            const roiData = await roiRes.json();
            setUsage(usageData);
            setAgents(agentsData);
            setRoi(roiData);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [apiBaseUrl]);
    if (loading && !usage) {
        return (_jsx("div", { className: styles.panel, children: _jsx("p", { className: styles.loadingError, children: "Loading cost data..." }) }));
    }
    if (error) {
        return (_jsx("div", { className: styles.panel, children: _jsxs("p", { className: styles.error, children: ["Error: ", error] }) }));
    }
    return (_jsxs("div", { ref: ref, className: styles.panel, role: "region", "aria-labelledby": "cost-title", tabIndex: 0, children: [_jsxs("div", { className: styles.card, children: [_jsx("div", { id: "cost-title", className: styles.header, children: "\uD83D\uDCCA Usage & Cost (24h)" }), _jsxs("div", { className: styles.row, children: [_jsx("span", { className: styles.label, children: "Tokens" }), _jsx("span", { className: styles.value, children: usage?.dailyTokens.toLocaleString() || 0 })] }), _jsxs("div", { className: styles.row, children: [_jsx("span", { className: styles.label, children: "Cost (USD)" }), _jsxs("span", { className: styles.value, children: ["$", usage?.dailyCost.toFixed(4) || '0.0000'] })] }), _jsxs("div", { className: styles.row, children: [_jsx("span", { className: styles.label, children: "EMA Cost (USD)" }), _jsxs("span", { className: styles.value, children: ["$", usage?.emaCost.toFixed(4) || '0.0000'] })] }), usage?.byStage && Object.keys(usage.byStage).length > 0 && (_jsxs("div", { className: styles.stageSection, children: [_jsx("div", { className: `${styles.header} ${styles.headerSmall}`, children: "By Stage" }), Object.entries(usage.byStage).map(([stage, tokens]) => (_jsxs("div", { className: styles.row, children: [_jsx("span", { className: styles.label, children: stage }), _jsx("span", { className: styles.value, children: tokens.toLocaleString() })] }, stage)))] }))] }), _jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.header, children: "\uD83D\uDD25 Agent Burn (24h)" }), Object.entries(agents).length > 0 ? (_jsx("div", { children: Object.entries(agents).map(([agent, data]) => (_jsxs("div", { className: styles.agentEntry, children: [_jsx("div", { className: `${styles.header} ${styles.headerSmall} ${styles.valueSecondary}`, children: agent }), _jsxs("div", { className: styles.row, children: [_jsx("span", { className: styles.label, children: "Tokens" }), _jsx("span", { className: styles.value, children: data.tokens.toLocaleString() })] }), _jsxs("div", { className: styles.row, children: [_jsx("span", { className: styles.label, children: "Cost (USD)" }), _jsxs("span", { className: styles.value, children: ["$", data.cost.toFixed(4)] })] })] }, agent))) })) : (_jsx("p", { className: styles.noActivity, children: "No agent activity" }))] }), _jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.header, children: "\uD83D\uDCB0 Local Model ROI" }), _jsxs("div", { className: styles.row, children: [_jsx("span", { className: styles.label, children: "Daily Savings (USD)" }), _jsxs("span", { className: styles.valuePrimary, children: ["$", roi?.dailySavings.toFixed(4) || '0.0000'] })] }), _jsxs("div", { className: styles.row, children: [_jsx("span", { className: styles.label, children: "GPU Cost/Day (USD)" }), _jsxs("span", { className: styles.value, children: ["$", roi?.gpuCostPerDay.toFixed(4) || '0.0000'] })] }), _jsxs("div", { className: styles.row, children: [_jsx("span", { className: styles.label, children: "ROI Multiplier" }), _jsxs("span", { className: roi && roi.roi > 1 ? styles.valuePrimary : styles.roiNeutral, children: [roi?.roi.toFixed(2), "x"] })] })] }), _jsxs("div", { className: styles.lastUpdated, children: ["Last updated: ", new Date().toLocaleTimeString()] })] }));
});
CostComputePanel.displayName = 'CostComputePanel';
export default CostComputePanel;
//# sourceMappingURL=CostComputePanel.js.map