import { useEffect, useRef, useState } from 'react';
export function useChartDimensions() {
    const ref = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
    useEffect(() => {
        if (!ref.current)
            return;
        const resizeObserver = new ResizeObserver(() => {
            const { width, height } = ref.current.getBoundingClientRect();
            setDimensions({ width: Math.max(width, 100), height: Math.max(height, 100) });
        });
        resizeObserver.observe(ref.current);
        const rect = ref.current.getBoundingClientRect();
        if (rect.width > 0 || rect.height > 0) {
            setDimensions({ width: rect.width, height: rect.height });
        }
        return () => resizeObserver.disconnect();
    }, []);
    return { width: dimensions.width, height: dimensions.height, ref };
}
//# sourceMappingURL=useChartDimensions.js.map