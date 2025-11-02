export const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp / 1_000_000n));
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        // hour: "2-digit",
        // minute: "2-digit",
    });
};

