const colorVariants = {
    blue: {
        bg: 'bg-blue-50',
        iconBg: 'bg-blue-100',
        text: 'text-blue-600',
        border: 'border-blue-200'
    },
    green: {
        bg: 'bg-green-50',
        iconBg: 'bg-green-100',
        text: 'text-green-600',
        border: 'border-green-200'
    },
    red: {
        bg: 'bg-red-50',
        iconBg: 'bg-red-100',
        text: 'text-red-600',
        border: 'border-red-200'
    },
    orange: {
        bg: 'bg-orange-50',
        iconBg: 'bg-orange-100',
        text: 'text-orange-600',
        border: 'border-orange-200'
    },
    slate: {
        bg: 'bg-slate-50',
        iconBg: 'bg-slate-100',
        text: 'text-slate-600',
        border: 'border-slate-200'
    },
    purple: {
        bg: 'bg-purple-50',
        iconBg: 'bg-purple-100',
        text: 'text-purple-600',
        border: 'border-purple-200'
    }
}

function IconCard({ color = 'blue', value = 0, icon: Icon, text }) {
    const theme = colorVariants[color] || colorVariants.blue

    return (
        <div className={`flex items-center gap-4 rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md bg-white ${theme.border}`}>
            {Icon && (
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${theme.iconBg} ${theme.text}`}>
                    <Icon size={22} />
                </div>
            )}
            <div className="flex flex-col min-w-0">
                <span className="text-2xl font-bold text-gray-900 leading-tight">{value}</span>
                <p className="text-xs text-gray-500 font-medium truncate leading-normal" title={text}>
                    {text}
                </p>
            </div>
        </div>
    )
}

export default IconCard;