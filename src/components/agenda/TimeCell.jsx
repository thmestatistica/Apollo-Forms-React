
const TimeCell = ({ header = false, hour = null }) => {
    if (header) {
        return (
            <div className="sticky top-0 z-10 border-b border-r border-gray-300 bg-apollo-200 text-apollo-100 font-bold p-3 text-center shadow-sm">
                Horário
            </div>
        );
    }

    return (
        <div className="border-b border-r border-gray-200 p-3 text-sm font-semibold text-gray-500 text-center bg-gray-100/50 group-hover:bg-gray-100 transition-colors">
            {String(hour).padStart(2,'0')}:00
        </div>
    );
};

export default TimeCell;
