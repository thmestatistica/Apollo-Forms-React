import React from "react";

const BadgeTextStatus = React.memo(({ status }) => {
    const st = (status || "").toLowerCase();
    if (st === "presente") return <span className="text-green-600 font-bold">✅ Presente</span>;
    if (st.includes("cancelado")) return <span className="text-red-500 font-bold">❌ Cancelado</span>;
    return <span className="text-gray-500 font-bold">⚠️ {status}</span>;
});

export default BadgeTextStatus;
