
function SkeletonGen({ range = 3, display = "block", className = "" }) {

    const skeletons = [];

    for (let i = 0; i < range; i++) {
        skeletons.push(i);
    }

    const containerClass = (display === "grid" ? `grid ${className}` : `space-y-3 ${className}`).trim();
    const itemClass = (`animate-pulse ${display === "grid" ? "" : "flex space-x-4"} p-5 rounded-xl border border-gray-100 bg-gray-50`).trim();

    return (
        <div className={containerClass}>
            {skeletons.map((i) => (
                <div key={i} className={itemClass}>
                    <div className="flex-1 space-y-3 py-1">
                        <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-2 bg-gray-200 rounded w-1/4"></div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default SkeletonGen