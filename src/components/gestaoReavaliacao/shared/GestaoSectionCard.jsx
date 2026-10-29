import React, { useState } from 'react';
import { twMerge } from 'tailwind-merge';

const GestaoSectionCard = ({
	title,
	count,
	countLabel,
	action,
	children,
	style,
	showBtn = false,
	btnLabel,
	btnIcon: Icon,
	onBtnClick = () => { },
	btnDisabled = false,

	// Modo abas
	tabs, // [{ id, label, icon? }]
	activeTab,
	onTabChange = () => { },
	defaultTab,
	tabsStyle
}) => {
	const hasTabs = Array.isArray(tabs) && tabs.length > 0;
	const [internalTab, setInternalTab] = useState(defaultTab ?? tabs?.[0]?.id);
	const currentTab = activeTab ?? internalTab;

	const handleTabChange = (id) => {
		setInternalTab(id);
		onTabChange(id);
	};

	return (
		<div className={twMerge("bg-white rounded-xl shadow-md border border-gray-100 flex flex-col min-h-[400px] overflow-hidden w-full", style)}>
			<div className={twMerge(
				"flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50",
				hasTabs ? "px-6 pt-4 pb-0 border-b border-gray-200" : "p-6 border-b border-gray-100",
				tabsStyle
			)}>
				<div className={twMerge(
					'flex w-full gap-4',
					hasTabs
						? "flex-col-reverse items-stretch sm:flex-row sm:items-end sm:justify-between"
						: "flex-row justify-between items-center"
				)}>
					{hasTabs ? (
						<div
							role="tablist"
							className="flex items-end gap-2 sm:gap-4 w-full sm:flex-1 min-w-0 overflow-x-auto pt-1 px-3 -mx-3 -mb-px"
						>
							{tabs.map((tab) => {
								const isActive = tab.id === currentTab;
								const TabIcon = tab.icon;
								return (
									<button
										key={tab.id}
										type="button"
										role="tab"
										aria-selected={isActive}
										aria-label={tab.label}
										title={tab.label}
										tabIndex={isActive ? 0 : -1}
										onClick={() => handleTabChange(tab.id)}
										className={twMerge(
											"relative flex items-center justify-center gap-2 px-3 sm:px-5 text-sm font-bold whitespace-nowrap",
											"flex-1 sm:flex-none",
											"rounded-t-xl transition-all cursor-pointer outline-none",
											"focus-visible:ring-2 focus-visible:ring-indigo-300  shadow-2xl",
											isActive
												? twMerge(
													"bg-white text-blue-700 py-3 z-10",
													"shadow-2xl",
													"before:content-[''] before:absolute before:bottom-0 before:-left-3 before:w-3 before:h-3 before:pointer-events-none",
													"before:bg-[radial-gradient(circle_at_0_0,transparent_12px,white_12.5px)]",
													"after:content-[''] after:absolute after:bottom-0 after:-right-3 after:w-3 after:h-3 after:pointer-events-none",
													"after:bg-[radial-gradient(circle_at_100%_0,transparent_12px,white_12.5px)]"
												)
												: "bg-blue-900/20 text-white py-2 hover:bg-blue-400"
										)}
									>
										{TabIcon && <TabIcon className="w-5 h-5 sm:w-4 sm:h-4 shrink-0" />}
										<span className={TabIcon ? "hidden sm:inline" : undefined}>{tab.label}</span>
									</button>
								);
							})}
						</div>
					) : (
						<div className="py-0">
							<h2 className="text-xl font-bold text-gray-800 cursor-default">{title}</h2>
							{countLabel ? (
								<div className="flex items-center gap-2 mt-1">
									<span
										className={`text-xs font-bold px-2 py-0.5 rounded-full ${count > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}
									>
										{count}
									</span>
									<span className="text-sm text-gray-500">{countLabel}</span>
								</div>
							) : null}
						</div>
					)}

					<div className={twMerge(hasTabs && "pb-0 sm:pb-3", "w-full sm:w-auto")}>
						{showBtn && (btnLabel || Icon) && (
							<button
								type="button"
								onClick={onBtnClick}
								disabled={btnDisabled}
								className={twMerge("w-full sm:w-auto flex items-center justify-center gap-2 bg-linear-to-r from-emerald-500 via-indigo-400",
									"to-emerald-500 bg-size-[200%_auto] hover:-translate-y-1 bg-left py-3 px-6 rounded-xl transition-all duration-500",
									"hover:bg-right text-white font-bold cursor-pointer", btnDisabled && "opacity-0")}
							>
								{Icon && (
									<span className="flex items-center py-1.5">
										<Icon className="w-3 h-3" />
									</span>
								)}
								{btnLabel && <span>{btnLabel}</span>}
							</button>
						)}
					</div>
				</div>
				{action}
			</div>

			{typeof children === 'function' ? children(currentTab) : children}
		</div>
	);
};

export default GestaoSectionCard;